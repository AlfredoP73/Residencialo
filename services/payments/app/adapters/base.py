from abc import ABC, abstractmethod
from typing import Dict, Any

class PaymentProviderAdapter(ABC):
    """
    Interfaz abstracta del Patrón Adapter/Strategy para pasarelas de pago PSE en Colombia.
    Garantiza que el microservicio no se acople a Wompi, PayU o ePayco.
    """

    @abstractmethod
    async def create_payment_transaction(self, obligation_id: str, amount: float, reference: str, redirect_url: str) -> Dict[str, Any]:
        """Crea la transacción en la pasarela y retorna la URL de checkout/redirección PSE."""
        pass

    @abstractmethod
    async def verify_transaction_status(self, provider_reference: str) -> Dict[str, Any]:
        """Consulta el estado oficial de una transacción directamente en el proveedor."""
        pass

    @abstractmethod
    def validate_webhook_signature(self, payload: Dict[str, Any], signature_header: str) -> bool:
        """Valida la firma de seguridad del webhook entrante para evitar falsificación."""
        pass
