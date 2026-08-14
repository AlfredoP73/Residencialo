"""API Gateway — Residencialo v2"""
import os, httpx, jwt, unicodedata
from typing import Optional
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="Residencialo API Gateway", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "super_secret_jwt_key_2026")
JWT_ALG    = "HS256"

SERVICES = {
    "auth":        os.getenv("AUTH_SERVICE_URL",        "http://auth-service:8001"),
    "residential": os.getenv("RESIDENTIAL_SERVICE_URL", "http://residential-service:8002"),
    "payments":    os.getenv("PAYMENTS_SERVICE_URL",    "http://payments-service:8003"),
    "community":   os.getenv("COMMUNITY_SERVICE_URL",   "http://community-service:8004"),
    "operations":  os.getenv("OPERATIONS_SERVICE_URL",  "http://operations-service:8005"),
    "management":  os.getenv("MANAGEMENT_SERVICE_URL",  "http://management-service:8006"),
}

_client: Optional[httpx.AsyncClient] = None

def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=30.0)
    return _client

PUBLIC_PATHS = {"/api/v1/auth/login", "/api/v1/auth/logout", "/health"}

def _resolve_service(path: str) -> Optional[str]:
    parts = path.strip("/").split("/")
    if len(parts) >= 3 and parts[0] == "api" and parts[1] == "v1":
        return SERVICES.get(parts[2])
    return None

def _ascii_safe(value: str) -> str:
    return unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii")

@app.get("/health")
def health(): return {"gateway": "online"}

@app.api_route("/api/v1/{full_path:path}",
               methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"])
async def gateway(full_path: str, request: Request) -> Response:
    path = f"/api/v1/{full_path}"

    if request.method == "OPTIONS":
        return Response(status_code=200)

    service_url = _resolve_service(path)
    if not service_url:
        return JSONResponse(status_code=404, content={"detail": f"No service for '{path}'"})

    user_id = user_role = user_name = apartment_id = apartment_number = None

    if path not in PUBLIC_PATHS:
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Token requerido"})
        try:
            payload        = jwt.decode(auth_header[7:], JWT_SECRET, algorithms=[JWT_ALG])
            user_id        = payload.get("sub", "")
            user_role      = payload.get("role", "")
            user_name      = payload.get("name", "")
            apartment_id   = payload.get("apartment_id") or ""
            apartment_number = payload.get("apartment_number") or ""
        except jwt.ExpiredSignatureError:
            return JSONResponse(status_code=401, content={"detail": "Token expirado"})
        except jwt.InvalidTokenError:
            return JSONResponse(status_code=401, content={"detail": "Token invalido"})

    target = f"{service_url}{path}"
    if request.url.query:
        target += f"?{request.url.query}"

    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)

    if user_id:
        headers["x-user-id"]           = _ascii_safe(user_id)
        headers["x-user-role"]         = _ascii_safe(user_role or "")
        headers["x-user-name"]         = _ascii_safe(user_name or "")
        headers["x-apartment-id"]      = _ascii_safe(apartment_id or "")
        headers["x-apartment-number"]  = _ascii_safe(apartment_number or "")

    body = await request.body()

    try:
        resp = await get_client().request(
            method=request.method, url=target, headers=headers, content=body)
        return Response(content=resp.content, status_code=resp.status_code,
                        headers=dict(resp.headers),
                        media_type=resp.headers.get("content-type","application/json"))
    except httpx.ConnectError:
        return JSONResponse(status_code=503, content={"detail": f"Servicio no disponible"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
