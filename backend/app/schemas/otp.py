from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserRead

class OTPRequest(BaseModel):
    email: EmailStr
    purpose: str = Field(default="registration", description="Purpose of the verification code")

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$", description="6-digit verification code")
    purpose: str = Field(default="registration", description="Purpose matching issuance")

class OTPResponse(BaseModel):
    success: bool = True
    message: str
    email: EmailStr
    cooldown_seconds: int = 60
    expires_in_seconds: int = 300

class OTPVerificationSuccessResponse(BaseModel):
    success: bool = True
    message: str
    is_verified: bool = True
    user: Optional[UserRead] = None
    access_token: Optional[str] = None
