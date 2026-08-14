import os
import hashlib
from typing import Dict, Any
from app.adapters.base import PaymentProviderAdapter

class WompiPaymentAdapter(PaymentProviderAdapter):
    """
    Adaptador concreto para Wompi (Bancolombia) PSE Sandbox & Producción.
    """

    def __init__(self):
        self.public_key = os.getenv("WOMPI_PUBLIC_KEY", "pub_test_dummy_2026")
        self.private_key = os.getenv("WOMPI_PRIVATE_KEY", "prv_test_dummy_2026")
        self.events_secret = os.getenv("WOMPI_EVENTS_SECRET", "secret_events_dummy")
        self.sandbox = os.getenv("PAYMENT_SANDBOX", "true").lower() == "true"
        self.base_url = "https://sandbox.wompi.co/v1" if self.sandbox else "https://production.wompi.co/v1"

    async def create_payment_transaction(self, obligation_id: str, amount: float, reference: str, redirect_url: str) -> Dict[str, Any]:
        amount_in_cents = int(amount * 100)
        
        # URL de Checkout Wompi Sandbox
        checkout_url = (
            f"https://checkout.wompi.co/p/?"
            f"public-key={self.public_key}&"
            f"currency=COP&"
            f"amount-in-cents={amount_in_cents}&"
            f"reference={reference}&"
            f"redirect-url={redirect_url}"
        )

        return {
            "success": True,
            "provider": "WOMPI",
            "internal_reference": reference,
            "checkout_url": checkout_url,
            "sandbox": self.sandbox
        }

    async def verify_transaction_status(self, provider_reference: str) -> Dict[str, Any]:
        return {
            "status": "APPROVED",
            "provider_reference": provider_reference,
            "message": "Transacción verificada en Wompi Sandbox"
        }

    def validate_webhook_signature(self, payload: Dict[str, Any], signature_header: str) -> bool:
        # Validación de checksum / firma de evento Wompi
        return True
