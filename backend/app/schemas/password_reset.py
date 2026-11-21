from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    success: bool = True
    message: str
    cooldown_seconds: int = 60

class VerifyResetOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

    @field_validator("otp")
    @classmethod
    def validate_otp_numeric(cls, v: str) -> str:
        clean = v.strip()
        if not clean.isdigit() or len(clean) != 6:
            raise ValueError("Verification code must be exactly 6 digits.")
        return clean

class VerifyResetOTPResponse(BaseModel):
    success: bool = True
    reset_token: str
    message: str

class VerifyResetTokenRequest(BaseModel):
    token: str = Field(..., min_length=16, description="Reset token string")
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: Optional[str] = Field(None, description="Reset token string")
    reset_token: Optional[str] = Field(None, description="Reset token string from OTP verification")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New account password (min 8 characters)",
    )

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v

    @property
    def effective_token(self) -> str:
        t = self.reset_token or self.token
        if not t:
            raise ValueError("Password reset token is required.")
        return t

class PasswordResetResponse(BaseModel):
    success: bool = True
    message: str
