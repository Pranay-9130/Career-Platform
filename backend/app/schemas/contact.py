from pydantic import BaseModel, EmailStr, Field

class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of inquirer")
    email: EmailStr = Field(..., description="Valid contact email address")
    subject: str = Field(..., min_length=3, max_length=150, description="Inquiry category or subject")
    message: str = Field(..., min_length=10, max_length=2000, description="Message body")

class ContactResponse(BaseModel):
    success: bool = True
    message: str = "Thank you for reaching out. We have received your message and will respond shortly."
