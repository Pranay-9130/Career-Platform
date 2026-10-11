import hmac
import hashlib
import secrets
from app.core.config import settings

def generate_secure_otp(length: int = 6) -> str:
    """
    Generates a cryptographically secure random 6-digit numerical OTP.
    Ensures a consistent 6-digit string without ambiguous leading characters.
    """
    if length == 6:
        # Generates an integer in [100000, 999999]
        return str(secrets.randbelow(900000) + 100000)
    
    # Generic length generator using secrets
    return "".join(secrets.choice("0123456789") for _ in range(length))

def hash_otp(otp: str) -> str:
    """
    Generates an HMAC-SHA256 digest of the raw OTP using the platform secret.
    Ensures the plaintext OTP is never persisted in storage.
    """
    secret_bytes = settings.JWT_SECRET.encode("utf-8")
    otp_bytes = otp.encode("utf-8")
    return hmac.new(secret_bytes, otp_bytes, hashlib.sha256).hexdigest()

def verify_otp_hash(plain_otp: str, stored_hash: str) -> bool:
    """
    Verifies a plain OTP against the stored hash in constant time
    to prevent timing side-channel attacks.
    """
    computed = hash_otp(plain_otp)
    return hmac.compare_digest(computed, stored_hash)
