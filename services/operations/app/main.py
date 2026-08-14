"""Operations Microservice — conectado a PostgreSQL"""
import os, uuid
from datetime import datetime, date
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import sys; sys.path.insert(0, "/app/shared")
from patterns import ResponseFactory, ValidationProxy, ValidationError, PackageNotification, VisitorNotification, InAppNotificationImpl
from database import get_db

app = FastAPI(title="Operations Microservice", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

pkg_notif     = PackageNotification(InAppNotificationImpl())
visitor_notif = VisitorNotification(InAppNotificationImpl())

def _role_check(role, *allowed):
    if role not in allowed:
        raise HTTPException(403, "Sin permisos")

class PackageCreate(BaseModel):
    apartment_id: str; apartment_number: str
    courier_company: str; tracking_number: Optional[str] = None; recipient_name: str

class VisitorCreate(BaseModel):
    apartment_id: str; apartment_number: str
    full_name: str; document_number: str
    vehicle_plate: Optional[str] = None; expected_date: Optional[str] = None

class StaffCreate(BaseModel):
    full_name: str; document_number: str; role_title: str = "PORTERO"
    phone: Optional[str] = None; contractor_company_name: Optional[str] = None

@app.get("/health")
def health(): return {"service": "operations", "status": "online"}

# ── Staff ───────────────────────────────────────────────────────────────
@app.get("/api/v1/operations/staff")
async def get_staff(x_user_role: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin", "doorman")
    r = await db.execute(text("""
        SELECT s.id, s.full_name, s.document_number, s.role_title, s.phone, s.is_active,
               c.name as contractor_company_name
        FROM ops_staff s LEFT JOIN ops_contractor_companies c ON c.id = s.contractor_company_id
        WHERE s.is_active = TRUE ORDER BY s.full_name
    """))
    rows = [{"id": str(x.id), "full_name": x.full_name, "document_number": x.document_number,
             "role_title": x.role_title, "phone": x.phone, "is_active": x.is_active,
             "contractor_company_name": x.contractor_company_name} for x in r.fetchall()]
    return ResponseFactory.success(rows)

@app.post("/api/v1/operations/staff")
async def create_staff(body: StaffCreate, x_user_role: Optional[str] = Header(None),
                        db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin")
    new_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO ops_staff (id, full_name, document_number, role_title, phone)
        VALUES (:id, :name, :doc, :role, :phone)
    """), {"id": new_id, "name": body.full_name, "doc": body.document_number,
           "role": body.role_title, "phone": body.phone})
    return ResponseFactory.success({"id": new_id, **body.model_dump()}, "Personal registrado")

# ── Packages ────────────────────────────────────────────────────────────
@app.get("/api/v1/operations/packages")
async def get_packages(
    status: Optional[str] = Query(None),
    apartment_number: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    q = """
        SELECT p.id, p.courier_company, p.tracking_number, p.recipient_name,
               p.received_at, p.delivered_at, p.status,
               a.apartment_number, t.name as tower
        FROM ops_packages p
        JOIN res_apartments a ON a.id = p.apartment_id
        JOIN res_towers t ON t.id = a.tower_id
        WHERE 1=1
    """
    params = {}
    if status:           q += " AND p.status = :status";               params["status"] = status
    if apartment_number: q += " AND a.apartment_number = :apt_num";    params["apt_num"] = apartment_number
    if search:
        q += " AND (p.recipient_name ILIKE :s OR p.tracking_number ILIKE :s)"
        params["s"] = f"%{search}%"
    q += " ORDER BY p.received_at DESC"
    r = await db.execute(text(q), params)
    rows = [{"id": str(x.id), "courier_company": x.courier_company,
             "tracking_number": x.tracking_number, "recipient_name": x.recipient_name,
             "received_at": x.received_at.isoformat() if x.received_at else None,
             "delivered_at": x.delivered_at.isoformat() if x.delivered_at else None,
             "status": x.status, "apartment_number": x.apartment_number, "tower": x.tower}
            for x in r.fetchall()]
    return ResponseFactory.paginated(rows, len(rows), 1, 100)

@app.post("/api/v1/operations/packages")
async def create_package(body: PackageCreate,
                          x_user_role: Optional[str] = Header(None),
                          db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin", "doorman")
    new_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO ops_packages (id, apartment_id, courier_company, tracking_number, recipient_name)
        VALUES (:id, :apt, :courier, :tracking, :recipient)
    """), {"id": new_id, "apt": body.apartment_id, "courier": body.courier_company,
           "tracking": body.tracking_number, "recipient": body.recipient_name})
    await pkg_notif.package_received("residente@residencialo.com", body.tracking_number or "N/A")
    return ResponseFactory.success({"id": new_id, **body.model_dump()}, "Paquete registrado")

@app.patch("/api/v1/operations/packages/{pkg_id}/deliver")
async def deliver_package(pkg_id: str, x_user_role: Optional[str] = Header(None),
                           db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin", "doorman")
    r = await db.execute(text("SELECT status FROM ops_packages WHERE id=:id"), {"id": pkg_id})
    pkg = r.fetchone()
    if not pkg: raise HTTPException(404, "Paquete no encontrado")
    if pkg.status == "ENTREGADO": raise HTTPException(400, "Ya fue entregado")
    await db.execute(text("""
        UPDATE ops_packages SET status='ENTREGADO', delivered_at=NOW() WHERE id=:id
    """), {"id": pkg_id})
    return ResponseFactory.success(None, "Paquete entregado")

# ── Visitors ────────────────────────────────────────────────────────────
@app.get("/api/v1/operations/visitors")
async def get_visitors(
    status: Optional[str] = Query(None),
    apartment_number: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    q = """
        SELECT v.id, v.full_name, v.document_number, v.vehicle_plate,
               v.expected_date, v.entry_timestamp, v.exit_timestamp, v.status,
               a.apartment_number
        FROM ops_visitors v JOIN res_apartments a ON a.id = v.apartment_id WHERE 1=1
    """
    params = {}
    if status:           q += " AND v.status = :status";            params["status"] = status
    if apartment_number: q += " AND a.apartment_number = :apt_num"; params["apt_num"] = apartment_number
    if search:
        q += " AND (v.full_name ILIKE :s OR v.document_number ILIKE :s)"
        params["s"] = f"%{search}%"
    q += " ORDER BY v.expected_date DESC"
    r = await db.execute(text(q), params)
    rows = [{"id": str(x.id), "full_name": x.full_name, "document_number": x.document_number,
             "vehicle_plate": x.vehicle_plate,
             "expected_date": str(x.expected_date) if x.expected_date else None,
             "entry_timestamp": x.entry_timestamp.isoformat() if x.entry_timestamp else None,
             "exit_timestamp": x.exit_timestamp.isoformat() if x.exit_timestamp else None,
             "status": x.status, "apartment_number": x.apartment_number}
            for x in r.fetchall()]
    return ResponseFactory.paginated(rows, len(rows), 1, 100)

@app.post("/api/v1/operations/visitors")
async def create_visitor(body: VisitorCreate,
                          x_user_role: Optional[str] = Header(None),
                          db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin", "resident", "doorman")
    new_id = str(uuid.uuid4())
    exp_date = body.expected_date or str(date.today())
    await db.execute(text("""
        INSERT INTO ops_visitors (id, apartment_id, full_name, document_number, vehicle_plate, expected_date)
        VALUES (:id, :apt, :name, :doc, :plate, :date)
    """), {"id": new_id, "apt": body.apartment_id, "name": body.full_name,
           "doc": body.document_number, "plate": body.vehicle_plate, "date": exp_date})
    await visitor_notif.visitor_arrived("residente@residencialo.com", body.full_name)
    return ResponseFactory.success({"id": new_id, **body.model_dump()}, "Visitante registrado")

@app.patch("/api/v1/operations/visitors/{vis_id}/entry")
async def register_entry(vis_id: str, x_user_role: Optional[str] = Header(None),
                          db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin", "doorman")
    await db.execute(text("""
        UPDATE ops_visitors SET status='EN_CONJUNTO', entry_timestamp=NOW() WHERE id=:id
    """), {"id": vis_id})
    return ResponseFactory.success(None, "Ingreso registrado")

@app.patch("/api/v1/operations/visitors/{vis_id}/exit")
async def register_exit(vis_id: str, x_user_role: Optional[str] = Header(None),
                         db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin", "doorman")
    await db.execute(text("""
        UPDATE ops_visitors SET status='RETIRADO', exit_timestamp=NOW() WHERE id=:id
    """), {"id": vis_id})
    return ResponseFactory.success(None, "Salida registrada")
