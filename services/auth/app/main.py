"""Auth & Users Microservice — PostgreSQL + bcrypt nativo"""
import os, bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import sys; sys.path.insert(0, "/app/shared")
from patterns import ResponseFactory, ValidationProxy, ValidationError
from database import get_db

app = FastAPI(title="Auth & Users Microservice", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

JWT_SECRET  = os.getenv("JWT_SECRET_KEY", "super_secret_jwt_key_2026")
JWT_ALG     = "HS256"
JWT_EXP_MIN = 60 * 8

class LoginRequest(BaseModel):
    email: str
    password: str

def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def _make_token(payload: dict) -> str:
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXP_MIN)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

@app.get("/health")
def health(): return {"service": "auth", "status": "online"}

@app.post("/api/v1/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        ValidationProxy({"email": req.email, "password": req.password})\
            .require("email").require("password")\
            .regex("email", r"^[^@]+@[^@]+\.[^@]+$", "Correo invalido")\
            .validate()
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))

    result = await db.execute(text("""
        SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active,
               r.code as role
        FROM auth_users u
        JOIN auth_user_roles ur ON ur.user_id = u.id
        JOIN cat_roles r ON r.id = ur.role_id
        WHERE u.email = :email
        LIMIT 1
    """), {"email": req.email})
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Credenciales invalidas")
    if not row.is_active:
        raise HTTPException(status_code=401, detail="Usuario inactivo")
    if not _verify_password(req.password, row.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    user_id = str(row.id)
    name    = f"{row.first_name} {row.last_name}"
    role    = row.role

    # Para residentes, obtener su apartment_id real de la BD
    apartment_id = None
    apartment_number = None
    if role == "resident":
        apt_r = await db.execute(text("""
            SELECT a.id, a.apartment_number
            FROM res_residents res
            JOIN res_apartments a ON a.id = res.apartment_id
            WHERE res.user_id = :uid AND res.is_active = TRUE
            LIMIT 1
        """), {"uid": user_id})
        apt = apt_r.fetchone()
        if apt:
            apartment_id     = str(apt.id)
            apartment_number = apt.apartment_number

    token = _make_token({
        "sub":               user_id,
        "email":             row.email,
        "role":              role,
        "name":              name,
        "apartment_id":      apartment_id,
        "apartment_number":  apartment_number,
    })

    return ResponseFactory.success({
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":               user_id,
            "email":            row.email,
            "name":             name,
            "role":             role,
            "apartment_id":     apartment_id,
            "apartment_number": apartment_number,
        }
    })

@app.get("/api/v1/auth/me")
def me(x_user_id: Optional[str] = Header(None),
       x_user_role: Optional[str] = Header(None),
       x_user_name: Optional[str] = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="No autenticado")
    return ResponseFactory.success({"id": x_user_id, "role": x_user_role, "name": x_user_name})

@app.post("/api/v1/auth/logout")
def logout(): return ResponseFactory.success(None, "Sesion cerrada")

@app.get("/api/v1/auth/users")
async def list_users(x_user_role: Optional[str] = Header(None),
                      db: AsyncSession = Depends(get_db)):
    if x_user_role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Sin permisos")
    result = await db.execute(text("""
        SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, r.code as role
        FROM auth_users u
        JOIN auth_user_roles ur ON ur.user_id = u.id
        JOIN cat_roles r ON r.id = ur.role_id
        ORDER BY u.first_name
    """))
    users = [{"id": str(r.id), "email": r.email,
               "name": f"{r.first_name} {r.last_name}",
               "role": r.role, "active": r.is_active}
             for r in result.fetchall()]
    return ResponseFactory.success(users)
