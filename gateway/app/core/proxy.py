import uuid
import httpx
import jwt
from fastapi import Request, Response, HTTPException, status
from app.core.config import settings

async def forward_request(target_url: str, request: Request) -> Response:
    """
    Reverse proxy helper: Reenvía la petición al microservicio interno inyectando
    los headers de trazabilidad y contexto de usuario (X-User-ID, X-User-Role).
    """
    correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
    auth_header = request.headers.get("Authorization")
    user_id = None
    user_role = None

    # Si la petición incluye JWT, lo decodificamos para extraer el contexto
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("sub")
            user_role = payload.get("role")
        except jwt.PyJWTError:
            # Si el token es inválido o expiró en peticiones protegidas
            pass

    # Preparar headers inter-servicio
    headers = dict(request.headers)
    headers["X-Correlation-ID"] = correlation_id
    headers["X-Internal-Secret"] = settings.INTERNAL_SERVICE_SECRET
    if user_id:
        headers["X-User-ID"] = str(user_id)
    if user_role:
        headers["X-User-Role"] = str(user_role)

    # Remover Host header para evitar conflictos
    headers.pop("host", None)

    body = await request.body()

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            target_full_url = f"{target_url}{request.url.path}"
            if request.url.query:
                target_full_url += f"?{request.url.query}"

            resp = await client.request(
                method=request.method,
                url=target_full_url,
                headers=headers,
                content=body
            )

            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers)
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"El microservicio de destino ({target_url}) no respondió: {str(exc)}"
            )
