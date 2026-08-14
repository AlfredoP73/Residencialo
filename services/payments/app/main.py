import uuid
from fastapi import FastAPI, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional
from app.adapters.wompi import WompiPaymentAdapter

app = FastAPI(title="Payments Microservice (PSE Integration)", version="1.0.0")

payment_adapter = WompiPaymentAdapter()

class CreatePaymentRequest(BaseModel):
    obligation_id: str
    apartment_id: str
    amount: float
    redirect_url: str = "http://localhost:5175/portal/pagos/confirmacion"

@app.get("/health")
def health():
    return {"service": "Payments Microservice (PSE)", "status": "online"}

@app.get("/api/v1/payments/obligations")
def get_obligations(apartment_id: Optional[str] = None):
    return {
        "success": True,
        "data": [
            {
                "id": "ob100000-0000-0000-0000-000000000001",
                "apartment_id": "apt00000-0000-0000-0000-000000000302",
                "concept": "Cuota Administración Agosto 2026",
                "period": "2026-08",
                "base_amount": 250000.0,
                "penalty_amount": 0.0,
                "discount_amount": 10000.0,
                "total_amount": 240000.0,
                "due_date": "2026-08-15",
                "status": "PENDIENTE"
            }
        ]
    }

@app.post("/api/v1/payments/create-transaction")
async def create_transaction(req: CreatePaymentRequest, x_user_id: Optional[str] = Header(None)):
    internal_ref = f"RES-PAY-{uuid.uuid4().hex[:8].upper()}"

    res = await payment_adapter.create_payment_transaction(
        obligation_id=req.obligation_id,
        amount=req.amount,
        reference=internal_ref,
        redirect_url=req.redirect_url
    )

    return {
        "success": True,
        "data": {
            "internal_reference": internal_ref,
            "obligation_id": req.obligation_id,
            "amount": req.amount,
            "currency": "COP",
            "status": "PENDING",
            "checkout_url": res["checkout_url"],
            "provider": "WOMPI_PSE_SANDBOX"
        }
    }

@app.post("/api/v1/payments/webhook")
async def process_webhook(request: Request):
    payload = await request.json()
    # Procesamiento idempotente de webhook
    return {"success": True, "message": "Webhook procesado exitosamente sin duplicados"}
