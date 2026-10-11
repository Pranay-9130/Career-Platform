from pydantic import BaseModel, EmailStr, Field, field_validator

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetTokenRequest(BaseModel):
    token: str = Field(..., min_length=16, description="Reset token string")
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str = Field(..., min_length=16, description="Reset token string")
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

class PasswordResetResponse(BaseModel):
    success: bool = True
    message: str
