import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Residencialo API Gateway"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", 8000))
    
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "super_secret_jwt_key_2026")
    JWT_ALGORITHM: str = "HS256"
    INTERNAL_SERVICE_SECRET: str = os.getenv("INTERNAL_SERVICE_SECRET", "sec_internal_res_2026_x9k2")

    # Internal Microservices URLs
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
    RESIDENTIAL_SERVICE_URL: str = os.getenv("RESIDENTIAL_SERVICE_URL", "http://residential-service:8002")
    PAYMENTS_SERVICE_URL: str = os.getenv("PAYMENTS_SERVICE_URL", "http://payments-service:8003")
    COMMUNITY_SERVICE_URL: str = os.getenv("COMMUNITY_SERVICE_URL", "http://community-service:8004")
    OPERATIONS_SERVICE_URL: str = os.getenv("OPERATIONS_SERVICE_URL", "http://operations-service:8005")
    MANAGEMENT_SERVICE_URL: str = os.getenv("MANAGEMENT_SERVICE_URL", "http://management-service:8006")

settings = Settings()
