"""
GoF Design Patterns — shared across all microservices.

Singleton  → DatabaseSession (one engine per process)
Factory    → ResponseFactory  (uniform API responses)
Builder    → QueryBuilder     (fluent filter chains)
Proxy      → ValidationProxy  (field-level validation before DB ops)
Adapter    → ExcelAdapter     (import spreadsheets → domain dicts)
Bridge     → NotificationBridge (decouple notification channels)
"""

from __future__ import annotations
import os, re
from typing import Any, Callable, Dict, List, Optional, Type
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# ─────────────────────────────────────────────
#  SINGLETON — Database engine per process
# ─────────────────────────────────────────────
class DatabaseSession:
    _instance: Optional["DatabaseSession"] = None
    _engine: Optional[AsyncEngine] = None
    _session_factory: Optional[Any] = None

    def __new__(cls) -> "DatabaseSession":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def initialize(self, database_url: str) -> None:
        if self._engine is not None:
            return  # already initialized
        self._engine = create_async_engine(database_url, echo=False, pool_pre_ping=True)
        self._session_factory = sessionmaker(
            bind=self._engine, class_=AsyncSession, expire_on_commit=False
        )

    @property
    def engine(self) -> AsyncEngine:
        if not self._engine:
            raise RuntimeError("DatabaseSession not initialized — call .initialize() first")
        return self._engine

    def get_session(self) -> AsyncSession:
        return self._session_factory()


db_singleton = DatabaseSession()


class Base(DeclarativeBase):
    pass


async def get_db():
    async with db_singleton.get_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ─────────────────────────────────────────────
#  FACTORY METHOD — Uniform API response shape
# ─────────────────────────────────────────────
class ResponseFactory:
    @staticmethod
    def success(data: Any, message: str = "OK", meta: Optional[Dict] = None) -> Dict:
        payload = {"success": True, "message": message, "data": data}
        if meta:
            payload["meta"] = meta
        return payload

    @staticmethod
    def error(message: str, code: int = 400, details: Any = None) -> Dict:
        payload = {"success": False, "message": message, "code": code}
        if details:
            payload["details"] = details
        return payload

    @staticmethod
    def paginated(items: List, total: int, page: int, page_size: int) -> Dict:
        return ResponseFactory.success(
            data=items,
            meta={"total": total, "page": page, "page_size": page_size,
                  "pages": (total + page_size - 1) // page_size},
        )


# ─────────────────────────────────────────────
#  BUILDER — Fluent SQL filter chain
# ─────────────────────────────────────────────
class QueryBuilder:
    def __init__(self, stmt):
        self._stmt = stmt

    def filter_eq(self, column, value) -> "QueryBuilder":
        if value is not None:
            self._stmt = self._stmt.where(column == value)
        return self

    def filter_like(self, column, value: Optional[str]) -> "QueryBuilder":
        if value:
            self._stmt = self._stmt.where(column.ilike(f"%{value}%"))
        return self

    def order_by(self, *cols) -> "QueryBuilder":
        self._stmt = self._stmt.order_by(*cols)
        return self

    def limit_offset(self, limit: int, offset: int) -> "QueryBuilder":
        self._stmt = self._stmt.limit(limit).offset(offset)
        return self

    def build(self):
        return self._stmt


# ─────────────────────────────────────────────
#  PROXY — Validation layer before DB writes
# ─────────────────────────────────────────────
class ValidationError(Exception):
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")


class ValidationProxy:
    """Wraps a dict/Pydantic model and runs registered validators before passing to service."""

    def __init__(self, data: Dict):
        self._data = dict(data)
        self._errors: List[Dict] = []

    def require(self, field: str) -> "ValidationProxy":
        if not self._data.get(field):
            self._errors.append({"field": field, "message": "Este campo es obligatorio"})
        return self

    def max_length(self, field: str, length: int) -> "ValidationProxy":
        val = self._data.get(field, "")
        if val and len(str(val)) > length:
            self._errors.append({"field": field, "message": f"Máximo {length} caracteres"})
        return self

    def regex(self, field: str, pattern: str, hint: str) -> "ValidationProxy":
        val = self._data.get(field, "")
        if val and not re.match(pattern, str(val)):
            self._errors.append({"field": field, "message": hint})
        return self

    def enum(self, field: str, choices: List[str]) -> "ValidationProxy":
        val = self._data.get(field)
        if val and val not in choices:
            self._errors.append({"field": field,
                                  "message": f"Debe ser uno de: {', '.join(choices)}"})
        return self

    def validate(self) -> Dict:
        """Raise HTTP-style error if any rule failed, otherwise return clean data."""
        if self._errors:
            raise ValidationError("validation", str(self._errors))
        return self._data


# ─────────────────────────────────────────────
#  ADAPTER — Excel import → domain dicts
# ─────────────────────────────────────────────
class ExcelAdapter:
    """
    Adapts a raw .xlsx file (via openpyxl) into a list of domain dicts
    matching the expected schema for each entity type.
    Entity schemas define which columns are required and their types.
    """

    SCHEMAS: Dict[str, Dict] = {
        "residents": {
            "required": ["documento", "nombres", "apellidos", "correo", "torre", "apartamento"],
            "optional": ["telefono", "tipo_residente"],
            "defaults": {"tipo_residente": "PROPIETARIO"},
        },
        "visitors": {
            "required": ["nombres", "documento", "apartamento"],
            "optional": ["placa", "fecha_visita"],
            "defaults": {},
        },
        "packages": {
            "required": ["apartamento", "empresa_mensajeria", "destinatario"],
            "optional": ["guia"],
            "defaults": {},
        },
    }

    @classmethod
    def adapt(cls, file_bytes: bytes, entity: str) -> Dict:
        try:
            import openpyxl
            from io import BytesIO
            wb = openpyxl.load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
            ws = wb.active
            rows = list(ws.iter_rows(values_only=True))
            if not rows:
                return {"success": False, "errors": ["El archivo está vacío"], "records": []}
        except Exception as e:
            return {"success": False, "errors": [f"No se pudo leer el archivo: {e}"], "records": []}

        schema = cls.SCHEMAS.get(entity)
        if not schema:
            return {"success": False, "errors": [f"Entidad '{entity}' no soportada"], "records": []}

        # Normalize headers from first row
        headers = [str(h).strip().lower().replace(" ", "_") if h else "" for h in rows[0]]
        required = schema["required"]
        missing = [r for r in required if r not in headers]
        if missing:
            return {"success": False,
                    "errors": [f"Columnas faltantes: {', '.join(missing)}"],
                    "records": []}

        records, errors = [], []
        for i, row in enumerate(rows[1:], start=2):
            record = dict(zip(headers, row))
            # Apply defaults
            for k, v in schema["defaults"].items():
                record.setdefault(k, v)
            # Check required non-null
            row_errors = [f for f in required if not record.get(f)]
            if row_errors:
                errors.append({"row": i, "missing": row_errors})
                continue
            records.append(record)

        return {"success": True, "total_rows": len(rows) - 1,
                "imported": len(records), "errors": errors, "records": records}


# ─────────────────────────────────────────────
#  BRIDGE — Notification channel abstraction
# ─────────────────────────────────────────────
class NotificationImplementor:
    """Implementor interface (Bridge)."""
    async def send(self, recipient: str, subject: str, body: str) -> bool:
        raise NotImplementedError


class InAppNotificationImpl(NotificationImplementor):
    """Stores notification in memory (MVP — no external dependency)."""
    _store: List[Dict] = []

    async def send(self, recipient: str, subject: str, body: str) -> bool:
        self.__class__._store.append({"to": recipient, "subject": subject, "body": body})
        return True

    @classmethod
    def get_all(cls) -> List[Dict]:
        return list(cls._store)


class LogNotificationImpl(NotificationImplementor):
    async def send(self, recipient: str, subject: str, body: str) -> bool:
        print(f"[NOTIF] → {recipient} | {subject}: {body}")
        return True


class Notification:
    """Abstraction (Bridge) — decoupled from transport."""
    def __init__(self, implementor: NotificationImplementor):
        self._impl = implementor

    async def notify(self, recipient: str, subject: str, body: str) -> bool:
        return await self._impl.send(recipient, subject, body)


class PackageNotification(Notification):
    async def package_received(self, resident_email: str, tracking: str) -> bool:
        return await self.notify(
            resident_email,
            "📦 Paquete recibido en portería",
            f"Su paquete (guía: {tracking}) fue recibido y está disponible para recoger.",
        )


class VisitorNotification(Notification):
    async def visitor_arrived(self, resident_email: str, visitor_name: str) -> bool:
        return await self.notify(
            resident_email,
            "🚗 Su visitante llegó",
            f"{visitor_name} se encuentra en portería esperando autorización.",
        )


class PqrsNotification(Notification):
    async def pqrs_updated(self, resident_email: str, ticket: str, status: str) -> bool:
        return await self.notify(
            resident_email,
            f"📋 PQRS {ticket} actualizada",
            f"El estado de su solicitud cambió a: {status}.",
        )
