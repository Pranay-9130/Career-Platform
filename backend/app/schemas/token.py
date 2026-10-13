from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str
    email: Optional[str] = None
    role: str = "STUDENT"
    exp: Optional[int] = None
    sid: Optional[str] = None
