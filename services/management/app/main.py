"""Management Microservice — conectado a PostgreSQL"""
import os, uuid
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import sys; sys.path.insert(0, "/app/shared")
from patterns import ResponseFactory, ValidationProxy, ValidationError, PqrsNotification, InAppNotificationImpl
from database import get_db

app = FastAPI(title="Management Microservice", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

pqrs_notif = PqrsNotification(InAppNotificationImpl())

def _role_check(role, *allowed):
    if role not in allowed: raise HTTPException(403, "Sin permisos")

class PqrsCreate(BaseModel):
    apartment_id: str; apartment_number: str; resident_name: str
    pqrs_type: str; subject: str; description: str; priority: str = "MEDIA"

class PqrsStatusUpdate(BaseModel):
    status: str; assigned_to_user_id: Optional[str] = None

class CommentCreate(BaseModel):
    comment_text: str; is_internal_note: bool = False; author: str = "Administracion"

@app.get("/health")
def health(): return {"service": "management", "status": "online"}

@app.get("/api/v1/management/dashboard/kpis")
async def dashboard_kpis(x_user_role: Optional[str] = Header(None),
                          db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin")
    total_apt = await db.execute(text("SELECT COUNT(*) FROM res_apartments"))
    occupied  = await db.execute(text("SELECT COUNT(*) FROM res_apartments WHERE status='HABITADO'"))
    residents = await db.execute(text("SELECT COUNT(*) FROM res_residents WHERE is_active=TRUE"))
    pkgs      = await db.execute(text("SELECT COUNT(*) FROM ops_packages WHERE status='RECIBIDO'"))
    pqrs_p    = await db.execute(text("SELECT COUNT(*) FROM mgt_pqrs WHERE status IN ('CREADA','EN_REVISION')"))
    reservas  = await db.execute(text("SELECT COUNT(*) FROM com_reservations WHERE status='APROBADA'"))
    avail_park= await db.execute(text("SELECT COUNT(*) FROM com_parking_spaces WHERE status='DISPONIBLE'"))
    return ResponseFactory.success({
        "total_apartments":         int(total_apt.scalar() or 0),
        "occupied_apartments":      int(occupied.scalar() or 0),
        "vacant_apartments":        int(total_apt.scalar() or 0) - int(occupied.scalar() or 0),
        "total_residents":          int(residents.scalar() or 0),
        "monthly_recollection_cop": 9600000.0,
        "delinquency_percentage":   5.2,
        "available_parking_spaces": int(avail_park.scalar() or 0),
        "pending_pqrs":             int(pqrs_p.scalar() or 0),
        "pending_packages":         int(pkgs.scalar() or 0),
        "active_reservations":      int(reservas.scalar() or 0),
    })

@app.get("/api/v1/management/pqrs")
async def get_pqrs(
    status: Optional[str] = Query(None), pqrs_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None), search: Optional[str] = Query(None),
    apartment_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    q = """
        SELECT p.id, p.ticket_number, p.subject, p.description, p.priority, p.status,
               p.created_at, p.updated_at, p.apartment_id,
               pt.code as pqrs_type, a.apartment_number
        FROM mgt_pqrs p
        JOIN cat_pqrs_types pt ON pt.id = p.pqrs_type_id
        JOIN res_apartments a ON a.id = p.apartment_id
        WHERE 1=1
    """
    params = {}
    if status:       q += " AND p.status = :status";          params["status"] = status
    if pqrs_type:    q += " AND pt.code = :type";             params["type"] = pqrs_type
    if priority:     q += " AND p.priority = :priority";      params["priority"] = priority
    if apartment_id: q += " AND p.apartment_id = :apt_id";    params["apt_id"] = apartment_id
    if search:
        q += " AND (p.subject ILIKE :s OR p.ticket_number ILIKE :s)"
        params["s"] = f"%{search}%"
    q += " ORDER BY CASE p.priority WHEN 'URGENTE' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 ELSE 4 END, p.created_at DESC"
    r = await db.execute(text(q), params)
    rows = [{"id": str(x.id), "ticket_number": x.ticket_number, "subject": x.subject,
             "description": x.description, "priority": x.priority, "status": x.status,
             "pqrs_type": x.pqrs_type, "apartment_number": x.apartment_number,
             "apartment_id": str(x.apartment_id),
             "created_at": x.created_at.isoformat() if x.created_at else None}
            for x in r.fetchall()]
    return ResponseFactory.paginated(rows, len(rows), 1, 100)

@app.post("/api/v1/management/pqrs")
async def create_pqrs(body: PqrsCreate,
                       x_user_role: Optional[str] = Header(None),
                       db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin", "resident")
    try:
        ValidationProxy(body.model_dump()).require("subject").require("description")\
            .enum("pqrs_type", ["PETICION","QUEJA","RECLAMO","SUGERENCIA"])\
            .enum("priority", ["BAJA","MEDIA","ALTA","URGENTE"]).validate()
    except ValidationError as e:
        raise HTTPException(422, str(e))
    count_r = await db.execute(text("SELECT COUNT(*) FROM mgt_pqrs"))
    ticket = f"PQRS-2026-{(count_r.scalar() or 0) + 1:04d}"
    type_r = await db.execute(text("SELECT id FROM cat_pqrs_types WHERE code=:code"),
                               {"code": body.pqrs_type})
    type_row = type_r.fetchone()
    if not type_row: raise HTTPException(422, "Tipo PQRS invalido")
    new_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO mgt_pqrs (id, ticket_number, apartment_id, pqrs_type_id, subject, description, priority)
        VALUES (:id, :ticket, :apt, :type_id, :subject, :desc, :priority)
    """), {"id": new_id, "ticket": ticket, "apt": body.apartment_id,
           "type_id": type_row.id, "subject": body.subject,
           "desc": body.description, "priority": body.priority})
    return ResponseFactory.success({"id": new_id, "ticket_number": ticket, **body.model_dump()}, f"PQRS creada: {ticket}")

@app.get("/api/v1/management/pqrs/{pqrs_id}")
async def get_pqrs_detail(pqrs_id: str, db: AsyncSession = Depends(get_db)):
    r = await db.execute(text("""
        SELECT p.*, pt.code as pqrs_type, a.apartment_number
        FROM mgt_pqrs p JOIN cat_pqrs_types pt ON pt.id=p.pqrs_type_id
        JOIN res_apartments a ON a.id=p.apartment_id WHERE p.id=:id
    """), {"id": pqrs_id})
    p = r.fetchone()
    if not p: raise HTTPException(404, "PQRS no encontrada")
    cr = await db.execute(text("""
        SELECT id, comment_text, is_internal_note, created_at,
               COALESCE((SELECT email FROM auth_users WHERE id=c.user_id), 'Administracion') as author
        FROM mgt_pqrs_comments c WHERE pqrs_id=:id ORDER BY created_at
    """), {"id": pqrs_id})
    comments = [{"id": str(c.id), "comment_text": c.comment_text,
                 "is_internal_note": c.is_internal_note, "author": c.author,
                 "created_at": c.created_at.isoformat() if c.created_at else None}
                for c in cr.fetchall()]
    return ResponseFactory.success({
        "id": str(p.id), "ticket_number": p.ticket_number, "subject": p.subject,
        "description": p.description, "priority": p.priority, "status": p.status,
        "pqrs_type": p.pqrs_type, "apartment_number": p.apartment_number,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "comments": comments
    })

@app.patch("/api/v1/management/pqrs/{pqrs_id}/status")
async def update_pqrs_status(pqrs_id: str, body: PqrsStatusUpdate,
                              x_user_role: Optional[str] = Header(None),
                              db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin")
    valid = ["CREADA","EN_REVISION","RESUELTA","CERRADA","RECHAZADA"]
    if body.status not in valid: raise HTTPException(422, "Estado invalido")
    await db.execute(text("""
        UPDATE mgt_pqrs SET status=:s, updated_at=NOW() WHERE id=:id
    """), {"s": body.status, "id": pqrs_id})
    return ResponseFactory.success(None, "Estado actualizado")

@app.post("/api/v1/management/pqrs/{pqrs_id}/comments")
async def add_comment(pqrs_id: str, body: CommentCreate,
                       x_user_role: Optional[str] = Header(None),
                       db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin", "resident")
    new_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO mgt_pqrs_comments (id, pqrs_id, comment_text, is_internal_note)
        VALUES (:id, :pqrs, :text, :internal)
    """), {"id": new_id, "pqrs": pqrs_id, "text": body.comment_text,
           "internal": body.is_internal_note})
    return ResponseFactory.success({"id": new_id, **body.model_dump()}, "Comentario agregado")

@app.get("/api/v1/management/documents")
async def get_documents(category: Optional[str] = Query(None),
                         x_user_role: Optional[str] = Header(None),
                         db: AsyncSession = Depends(get_db)):
    q = """
        SELECT d.id, d.title, d.description, d.file_url, d.visibility, d.created_at,
               dc.code as category
        FROM mgt_documents d JOIN cat_document_categories dc ON dc.id=d.category_id WHERE 1=1
    """
    params = {}
    if x_user_role not in ("admin","superadmin","resident","doorman"):
        q += " AND d.visibility='PUBLIC'"
    if category:
        q += " AND dc.code=:cat"; params["cat"] = category
    r = await db.execute(text(q + " ORDER BY d.created_at DESC"), params)
    rows = [{"id": str(x.id), "title": x.title, "description": x.description,
             "file_url": x.file_url, "visibility": x.visibility,
             "category": x.category,
             "created_at": x.created_at.isoformat() if x.created_at else None}
            for x in r.fetchall()]
    return ResponseFactory.success(rows)
