from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.STUDENT
    headline: Optional[str] = None
    avatar_url: Optional[str] = None

class UserRead(UserBase):
    id: UUID
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="Account password (min 8 characters)")
    full_name: str = Field(..., min_length=2, max_length=150, description="Full name of user")
    role: UserRole = UserRole.STUDENT
    headline: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        return trimmed

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, description="Account password")

class GoogleLoginRequest(BaseModel):
    credential: str = Field(..., min_length=10, description="Google Cloud ID Token JWT")

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    message: Optional[str] = None
