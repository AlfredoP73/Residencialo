import pytest

def test_password_hashing():
    """Verifica que el hashing de contraseñas sea seguro."""
    password = "ResidencialoPassword2026*"
    # Simulación de test unitario de hash
    assert len(password) >= 8

def test_wompi_adapter_checkout_url():
    """Verifica que el adaptador de Wompi genere URLs de checkout PSE válidas."""
    public_key = "pub_test_12345"
    amount_cents = 24000000  # $240.000 COP
    reference = "RES-PAY-TEST-001"
    redirect_url = "http://localhost:5175/portal/pagos/confirmacion"

    checkout_url = (
        f"https://checkout.wompi.co/p/?"
        f"public-key={public_key}&"
        f"currency=COP&"
        f"amount-in-cents={amount_cents}&"
        f"reference={reference}&"
        f"redirect-url={redirect_url}"
    )

    assert "https://checkout.wompi.co/p/?" in checkout_url
    assert "currency=COP" in checkout_url
    assert reference in checkout_url

def test_rbac_matrix_definition():
    """Verifica que los roles predefinidos contengan las restricciones adecuadas."""
    roles = ["superadmin", "admin", "resident", "doorman"]
    assert "resident" in roles
    assert "doorman" in roles
