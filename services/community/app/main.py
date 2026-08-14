"""Community Microservice — conectado a PostgreSQL"""
import os, uuid
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import sys; sys.path.insert(0, "/app/shared")
from patterns import ResponseFactory, ValidationProxy, ValidationError
from database import get_db

app = FastAPI(title="Community Microservice", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def _role_check(role, *allowed):
    if role not in allowed: raise HTTPException(403, "Sin permisos")

class ReservationCreate(BaseModel):
    common_area_id: str; apartment_id: str; apartment_number: str
    resident_name: str; reservation_date: str; start_time: str; end_time: str

class ParkingAssignmentCreate(BaseModel):
    parking_space_id: str; apartment_id: str; apartment_number: str
    vehicle_plate: Optional[str] = None

@app.get("/health")
def health(): return {"service": "community", "status": "online"}

@app.get("/api/v1/community/common-areas")
async def get_areas(active: Optional[bool] = Query(None), db: AsyncSession = Depends(get_db)):
    q = "SELECT ca.id, ca.name, ca.capacity, ca.hourly_rate, ca.rules_text, ca.requires_approval, ca.is_active FROM com_common_areas ca WHERE 1=1"
    params = {}
    if active is not None: q += " AND ca.is_active = :active"; params["active"] = active
    r = await db.execute(text(q + " ORDER BY ca.name"), params)
    rows = [{"id": str(x.id), "name": x.name, "capacity": x.capacity,
             "hourly_rate": float(x.hourly_rate), "rules_text": x.rules_text,
             "requires_approval": x.requires_approval, "is_active": x.is_active}
            for x in r.fetchall()]
    return ResponseFactory.success(rows)

@app.get("/api/v1/community/reservations")
async def get_reservations(
    status: Optional[str] = Query(None),
    apartment_id: Optional[str] = Query(None),
    common_area_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    q = """
        SELECT r.id, r.reservation_date, r.start_time, r.end_time, r.total_fee, r.status,
               r.created_at, ca.name as common_area_name, a.apartment_number,
               r.common_area_id, r.apartment_id
        FROM com_reservations r
        JOIN com_common_areas ca ON ca.id = r.common_area_id
        JOIN res_apartments a ON a.id = r.apartment_id
        WHERE 1=1
    """
    params = {}
    if status:         q += " AND r.status = :status";               params["status"] = status
    if apartment_id:   q += " AND r.apartment_id = :apt_id";         params["apt_id"] = apartment_id
    if common_area_id: q += " AND r.common_area_id = :area_id";      params["area_id"] = common_area_id
    q += " ORDER BY r.reservation_date DESC, r.start_time"
    r = await db.execute(text(q), params)
    rows = [{"id": str(x.id), "common_area_name": x.common_area_name,
             "apartment_number": x.apartment_number,
             "reservation_date": str(x.reservation_date),
             "start_time": str(x.start_time)[:5], "end_time": str(x.end_time)[:5],
             "total_fee": float(x.total_fee), "status": x.status,
             "common_area_id": str(x.common_area_id), "apartment_id": str(x.apartment_id)}
            for x in r.fetchall()]
    return ResponseFactory.paginated(rows, len(rows), 1, 100)

@app.post("/api/v1/community/reservations")
async def create_reservation(body: ReservationCreate,
                              x_user_role: Optional[str] = Header(None),
                              db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin", "resident")
    # Verificar conflicto de horario
    conflict = await db.execute(text("""
        SELECT id FROM com_reservations
        WHERE common_area_id = :area AND reservation_date = :date
        AND status NOT IN ('RECHAZADA','CANCELADA')
        AND NOT (:end_time <= start_time OR :start_time >= end_time)
    """), {"area": body.common_area_id, "date": body.reservation_date,
           "start_time": body.start_time, "end_time": body.end_time})
    if conflict.fetchone():
        raise HTTPException(409, "El espacio ya esta reservado en ese horario")
    # Calcular fee
    area_r = await db.execute(text(
        "SELECT hourly_rate, requires_approval FROM com_common_areas WHERE id=:id"),
        {"id": body.common_area_id})
    area = area_r.fetchone()
    fee = 0.0
    status = "SOLICITADA"
    if area:
        sh, sm = map(int, body.start_time.split(":"))
        eh, em = map(int, body.end_time.split(":"))
        hours = max(0, (eh*60+em - sh*60-sm)/60)
        fee = round(hours * float(area.hourly_rate), 2)
        status = "SOLICITADA" if area.requires_approval else "APROBADA"
    new_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO com_reservations (id, common_area_id, apartment_id, reservation_date, start_time, end_time, total_fee, status)
        VALUES (:id, :area, :apt, :date, :start, :end, :fee, :status)
    """), {"id": new_id, "area": body.common_area_id, "apt": body.apartment_id,
           "date": body.reservation_date, "start": body.start_time, "end": body.end_time,
           "fee": fee, "status": status})
    return ResponseFactory.success({"id": new_id, **body.model_dump(), "status": status, "total_fee": fee}, "Reserva creada")

@app.patch("/api/v1/community/reservations/{rsv_id}/status")
async def update_reservation_status(rsv_id: str, body: dict,
                                     x_user_role: Optional[str] = Header(None),
                                     db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin")
    new_status = body.get("status")
    if new_status not in ("APROBADA","RECHAZADA","CANCELADA"):
        raise HTTPException(422, "Estado invalido")
    await db.execute(text("UPDATE com_reservations SET status=:s, updated_at=NOW() WHERE id=:id"),
                     {"s": new_status, "id": rsv_id})
    return ResponseFactory.success(None, "Estado actualizado")

@app.get("/api/v1/community/parking-spaces")
async def get_parking(status: Optional[str] = Query(None),
                       parking_type: Optional[str] = Query(None),
                       db: AsyncSession = Depends(get_db)):
    q = "SELECT id, space_number, location_zone, parking_type, status FROM com_parking_spaces WHERE 1=1"
    params = {}
    if status:       q += " AND status = :status";           params["status"] = status
    if parking_type: q += " AND parking_type = :type";       params["type"] = parking_type
    r = await db.execute(text(q + " ORDER BY space_number"), params)
    rows = [{"id": str(x.id), "space_number": x.space_number, "location_zone": x.location_zone,
             "parking_type": x.parking_type, "status": x.status} for x in r.fetchall()]
    return ResponseFactory.success(rows)

@app.get("/api/v1/community/parking-assignments")
async def get_assignments(apartment_id: Optional[str] = Query(None),
                           db: AsyncSession = Depends(get_db)):
    q = """
        SELECT pa.id, pa.assigned_at, pa.is_active,
               ps.space_number, a.apartment_number, pa.apartment_id
        FROM com_parking_assignments pa
        JOIN com_parking_spaces ps ON ps.id = pa.parking_space_id
        JOIN res_apartments a ON a.id = pa.apartment_id
        WHERE pa.is_active = TRUE
    """
    params = {}
    if apartment_id: q += " AND pa.apartment_id = :apt"; params["apt"] = apartment_id
    r = await db.execute(text(q), params)
    rows = [{"id": str(x.id), "space_number": x.space_number,
             "apartment_number": x.apartment_number,
             "apartment_id": str(x.apartment_id), "is_active": x.is_active}
            for x in r.fetchall()]
    return ResponseFactory.success(rows)

@app.post("/api/v1/community/parking-assignments")
async def assign_parking(body: ParkingAssignmentCreate,
                          x_user_role: Optional[str] = Header(None),
                          db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin")
    space_r = await db.execute(text("SELECT status FROM com_parking_spaces WHERE id=:id"),
                                {"id": body.parking_space_id})
    space = space_r.fetchone()
    if not space: raise HTTPException(404, "Espacio no encontrado")
    if space.status == "ASIGNADO": raise HTTPException(409, "El espacio ya esta asignado")
    new_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO com_parking_assignments (id, parking_space_id, apartment_id)
        VALUES (:id, :space, :apt)
    """), {"id": new_id, "space": body.parking_space_id, "apt": body.apartment_id})
    await db.execute(text("UPDATE com_parking_spaces SET status='ASIGNADO' WHERE id=:id"),
                     {"id": body.parking_space_id})
    return ResponseFactory.success({"id": new_id, **body.model_dump()}, "Parqueadero asignado")
