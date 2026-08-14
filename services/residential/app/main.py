"""
Residential Microservice — conectado a PostgreSQL
"""
import os, uuid
from datetime import date
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import sys; sys.path.insert(0, "/app/shared")
from patterns import ResponseFactory, ValidationProxy, ValidationError, ExcelAdapter
from database import get_db

app = FastAPI(title="Residential Microservice", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def _role_check(role, *allowed):
    if role not in allowed:
        raise HTTPException(status_code=403, detail="Sin permisos")

class ApartmentCreate(BaseModel):
    tower_id: str; apartment_number: str; floor: int
    area_sqm: Optional[float] = None; coefficient: float = 0.0250; status: str = "HABITADO"

class ResidentCreate(BaseModel):
    apartment_id: str; full_name: str; email: str
    document_type: str = "CC"; document_number: str
    phone: Optional[str] = None; resident_type: str = "PROPIETARIO"

class VehicleCreate(BaseModel):
    apartment_id: str; license_plate: str; vehicle_type: str = "CARRO"
    brand: Optional[str] = None; model: Optional[str] = None; color: Optional[str] = None

@app.get("/health")
def health(): return {"service": "residential", "status": "online"}

# ── Towers ──────────────────────────────────────────────────────────────
@app.get("/api/v1/residential/towers")
async def get_towers(db: AsyncSession = Depends(get_db)):
    r = await db.execute(text("SELECT id, name, number, total_floors FROM res_towers ORDER BY number"))
    rows = [{"id": str(x.id), "name": x.name, "number": x.number, "total_floors": x.total_floors}
            for x in r.fetchall()]
    return ResponseFactory.success(rows)

# ── Apartments ──────────────────────────────────────────────────────────
@app.get("/api/v1/residential/apartments")
async def get_apartments(
    status: Optional[str] = Query(None),
    tower_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    q = """
        SELECT a.id, a.apartment_number, a.floor, a.coefficient, a.area_sqm, a.status,
               t.id as tower_id, t.name as tower
        FROM res_apartments a JOIN res_towers t ON t.id = a.tower_id
        WHERE 1=1
    """
    params = {}
    if status:   q += " AND a.status = :status";      params["status"] = status
    if tower_id: q += " AND a.tower_id = :tower_id";  params["tower_id"] = tower_id
    if search:   q += " AND a.apartment_number ILIKE :s"; params["s"] = f"%{search}%"
    q += " ORDER BY t.number, a.floor, a.apartment_number"
    r = await db.execute(text(q), params)
    rows = [{"id": str(x.id), "apartment_number": x.apartment_number, "floor": x.floor,
             "coefficient": float(x.coefficient), "area_sqm": float(x.area_sqm) if x.area_sqm else None,
             "status": x.status, "tower_id": str(x.tower_id), "tower": x.tower}
            for x in r.fetchall()]
    return ResponseFactory.paginated(rows, len(rows), 1, 100)

@app.get("/api/v1/residential/apartments/{apt_id}")
async def get_apartment(apt_id: str, db: AsyncSession = Depends(get_db)):
    r = await db.execute(text("""
        SELECT a.*, t.name as tower FROM res_apartments a
        JOIN res_towers t ON t.id = a.tower_id WHERE a.id = :id
    """), {"id": apt_id})
    apt = r.fetchone()
    if not apt: raise HTTPException(404, "Apartamento no encontrado")
    rv = await db.execute(text("""
        SELECT v.* FROM res_vehicles v WHERE v.apartment_id = :id
    """), {"id": apt_id})
    vehicles = [{"id": str(v.id), "license_plate": v.license_plate, "vehicle_type": v.vehicle_type,
                 "brand": v.brand, "model": v.model, "color": v.color} for v in rv.fetchall()]
    rr = await db.execute(text("""
        SELECT rc.full_name, rc.email, rc.phone, res.resident_type
        FROM res_residents res
        LEFT JOIN res_resident_contacts rc ON rc.id = res.contact_id
        WHERE res.apartment_id = :id AND res.is_active = TRUE
    """), {"id": apt_id})
    residents = [{"full_name": r.full_name, "email": r.email,
                  "phone": r.phone, "resident_type": r.resident_type} for r in rr.fetchall()]
    return ResponseFactory.success({
        "id": apt_id, "apartment_number": apt.apartment_number,
        "floor": apt.floor, "coefficient": float(apt.coefficient),
        "area_sqm": float(apt.area_sqm) if apt.area_sqm else None,
        "status": apt.status, "tower": apt.tower,
        "vehicles": vehicles, "residents": residents
    })

@app.post("/api/v1/residential/apartments")
async def create_apartment(body: ApartmentCreate,
                            x_user_role: Optional[str] = Header(None),
                            db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin")
    try:
        ValidationProxy(body.model_dump()).require("apartment_number").require("floor")\
            .enum("status", ["HABITADO","DESOCUPADO","EN_REFORMA"]).validate()
    except ValidationError as e:
        raise HTTPException(422, str(e))
    new_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO res_apartments (id, tower_id, apartment_number, floor, coefficient, area_sqm, status)
        VALUES (:id, :tower_id, :num, :floor, :coef, :area, :status)
    """), {"id": new_id, "tower_id": body.tower_id, "num": body.apartment_number,
           "floor": body.floor, "coef": body.coefficient,
           "area": body.area_sqm, "status": body.status})
    return ResponseFactory.success({"id": new_id, **body.model_dump()}, "Apartamento creado")

@app.patch("/api/v1/residential/apartments/{apt_id}")
async def update_apartment(apt_id: str, body: dict,
                            x_user_role: Optional[str] = Header(None),
                            db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin")
    allowed = {"status", "area_sqm", "coefficient"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if updates:
        sets = ", ".join(f"{k} = :{k}" for k in updates)
        await db.execute(text(f"UPDATE res_apartments SET {sets} WHERE id = :id"),
                         {**updates, "id": apt_id})
    return ResponseFactory.success(None, "Actualizado")

# ── Residents ───────────────────────────────────────────────────────────
@app.get("/api/v1/residential/residents")
async def get_residents(
    apartment_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    q = """
        SELECT res.id, res.resident_type, res.is_active, res.start_date,
               rc.full_name, rc.email, rc.phone, rc.document_type, rc.document_number,
               a.apartment_number, t.name as tower, a.id as apartment_id
        FROM res_residents res
        LEFT JOIN res_resident_contacts rc ON rc.id = res.contact_id
        JOIN res_apartments a ON a.id = res.apartment_id
        JOIN res_towers t ON t.id = a.tower_id
        WHERE 1=1
    """
    params = {}
    if apartment_id: q += " AND res.apartment_id = :apt_id"; params["apt_id"] = apartment_id
    if active is not None: q += " AND res.is_active = :active"; params["active"] = active
    if search:
        q += " AND (rc.full_name ILIKE :s OR rc.document_number ILIKE :s)"
        params["s"] = f"%{search}%"
    q += " ORDER BY rc.full_name"
    r = await db.execute(text(q), params)
    rows = [{"id": str(x.id), "full_name": x.full_name, "email": x.email,
             "phone": x.phone, "document_type": x.document_type,
             "document_number": x.document_number, "resident_type": x.resident_type,
             "is_active": x.is_active, "apartment_number": x.apartment_number,
             "tower": x.tower, "apartment_id": str(x.apartment_id)}
            for x in r.fetchall()]
    return ResponseFactory.paginated(rows, len(rows), 1, 100)

@app.post("/api/v1/residential/residents")
async def create_resident(body: ResidentCreate,
                           x_user_role: Optional[str] = Header(None),
                           db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin")
    try:
        ValidationProxy(body.model_dump()).require("full_name").require("document_number")\
            .require("email").regex("email", r"^[^@]+@[^@]+\.[^@]+$", "Correo invalido")\
            .enum("resident_type", ["PROPIETARIO","ARRENDATARIO","FAMILIAR"]).validate()
    except ValidationError as e:
        raise HTTPException(422, str(e))
    contact_id = str(uuid.uuid4())
    res_id     = str(uuid.uuid4())
    parts = body.full_name.strip().split(" ", 1)
    await db.execute(text("""
        INSERT INTO res_resident_contacts (id, full_name, document_type, document_number, email, phone)
        VALUES (:id, :name, :dt, :dn, :email, :phone)
        ON CONFLICT (document_type, document_number) DO UPDATE SET email=EXCLUDED.email
    """), {"id": contact_id, "name": body.full_name, "dt": body.document_type,
           "dn": body.document_number, "email": body.email, "phone": body.phone})
    await db.execute(text("""
        INSERT INTO res_residents (id, apartment_id, contact_id, resident_type, is_active)
        VALUES (:id, :apt, :contact, :type, TRUE)
    """), {"id": res_id, "apt": body.apartment_id, "contact": contact_id,
           "type": body.resident_type})
    return ResponseFactory.success({"id": res_id, **body.model_dump()}, "Residente registrado")

@app.delete("/api/v1/residential/residents/{res_id}")
async def deactivate_resident(res_id: str,
                               x_user_role: Optional[str] = Header(None),
                               db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin")
    await db.execute(text("UPDATE res_residents SET is_active=FALSE WHERE id=:id"), {"id": res_id})
    return ResponseFactory.success(None, "Residente desactivado")

# ── Vehicles ────────────────────────────────────────────────────────────
@app.get("/api/v1/residential/vehicles")
async def get_vehicles(apartment_id: Optional[str] = Query(None),
                        db: AsyncSession = Depends(get_db)):
    q = "SELECT * FROM res_vehicles WHERE 1=1"
    params = {}
    if apartment_id: q += " AND apartment_id = :apt"; params["apt"] = apartment_id
    r = await db.execute(text(q), params)
    rows = [{"id": str(x.id), "apartment_id": str(x.apartment_id), "license_plate": x.license_plate,
             "vehicle_type": x.vehicle_type, "brand": x.brand, "model": x.model, "color": x.color}
            for x in r.fetchall()]
    return ResponseFactory.success(rows)

@app.post("/api/v1/residential/vehicles")
async def create_vehicle(body: VehicleCreate,
                          x_user_role: Optional[str] = Header(None),
                          db: AsyncSession = Depends(get_db)):
    _role_check(x_user_role, "admin", "superadmin", "resident")
    try:
        ValidationProxy(body.model_dump()).require("license_plate").require("apartment_id")\
            .enum("vehicle_type", ["CARRO","MOTO","BICICLETA"]).validate()
    except ValidationError as e:
        raise HTTPException(422, str(e))
    new_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO res_vehicles (id, apartment_id, license_plate, vehicle_type, brand, model, color)
        VALUES (:id, :apt, :plate, :type, :brand, :model, :color)
    """), {"id": new_id, "apt": body.apartment_id, "plate": body.license_plate,
           "type": body.vehicle_type, "brand": body.brand,
           "model": body.model, "color": body.color})
    return ResponseFactory.success({"id": new_id, **body.model_dump()}, "Vehiculo registrado")
