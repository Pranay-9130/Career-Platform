from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import uuid
import jwt
from passlib.context import CryptContext
from app.core.config import settings

import bcrypt

# Password hashing context (Bcrypt / Argon2 fallback)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a raw password against its stored hash with optimized direct bcrypt execution."""
    if not plain_password or not hashed_password:
        return False
    try:
        if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        pass
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generate secure bcrypt hash with balanced round complexity."""
    try:
        salt = bcrypt.gensalt(rounds=11)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    except Exception:
        return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
        "jti": str(uuid.uuid4()),
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a long-lived JWT intended only for the HttpOnly refresh cookie."""
    now = datetime.now(timezone.utc)
    to_encode = data.copy()
    to_encode.update({
        "exp": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "iat": now,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    })
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str, expected_type: str = "access") -> Optional[Dict[str, Any]]:
    """Decode and validate signature/expiration of a JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        # Tokens created before token typing was introduced remain valid as access tokens.
        if payload.get("type", "access") != expected_type:
            return None
        return payload
    except jwt.PyJWTError:
        return None
