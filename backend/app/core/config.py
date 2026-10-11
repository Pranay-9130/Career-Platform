from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator, field_validator

class Settings(BaseSettings):
    # App Information
    PROJECT_NAME: str = "Student Career Platform"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    DEBUG: bool = True
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    FRONTEND_URL: str = Field(
        default="http://localhost:5173",
        description="Public frontend base URL for sitemap and canonical links",
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                import json
                try:
                    parsed = json.loads(v_str)
                    return [str(o).rstrip("/") for o in parsed if o]
                except Exception:
                    return [
                        o.strip().rstrip("/")
                        for o in v_str.strip("[]").split(",")
                        if o.strip()
                    ]
            return [
                o.strip().rstrip("/")
                for o in v_str.split(",")
                if o.strip()
            ]
        elif isinstance(v, list):
            return [str(o).rstrip("/") for o in v if o]
        return v

    # Database Configuration (PostgreSQL default, SQLite fallback for unit testing)
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/career_platform",
        description="Async database connection string"
    )
    SYNC_DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/career_platform",
        description="Synchronous database connection string for migrations"
    )

    @model_validator(mode="after")
    def assemble_database_urls(self):
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        # Asyncpg uses 'ssl=require' instead of psycopg2's 'sslmode=require'
        if "postgresql+asyncpg://" in url and "sslmode=" in url:
            url = url.replace("sslmode=", "ssl=")
        self.DATABASE_URL = url

        sync_url = self.SYNC_DATABASE_URL
        if sync_url.startswith("postgres://"):
            sync_url = sync_url.replace("postgres://", "postgresql://", 1)
        elif sync_url.startswith("postgresql+asyncpg://"):
            sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql://", 1)
        self.SYNC_DATABASE_URL = sync_url
        return self

    # Security & Tokens
    JWT_SECRET: str = "development_secret_change_in_production_minimum_64_characters_random_hex"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google Authentication (OAuth2 / Identity Services)
    GOOGLE_CLIENT_ID: str = ""

    # Email & OTP
    EMAIL_PROVIDER: str = "sendgrid"  # "smtp", "sendgrid", "resend", or "console"
    EMAIL_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@careerplatform.com"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    OTP_EXPIRE_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60

    # Google Gemini AI (Backend Only)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"

    # Storage
    STORAGE_PROVIDER: str = "s3"
    STORAGE_BUCKET: str = "student-career-platform-uploads"
    STORAGE_REGION: str = "us-east-1"
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
