import os
import time
import uuid
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Optional, List, Any, Dict, Tuple
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.models.auth_session import AuthSession
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
    auto_error=False,
)

async def get_token_payload(token: Optional[str] = Depends(oauth2_scheme)) -> TokenPayload:
    """
    Extracts and validates the JWT Bearer token from the Authorization header.
    Raises HTTP 401 Unauthorized if the token is missing, invalid, or expired.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload_dict = decode_token(token)
    if not payload_dict or "sub" not in payload_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return TokenPayload(
            sub=str(payload_dict.get("sub")),
            email=payload_dict.get("email"),
            role=str(payload_dict.get("role", "STUDENT")),
            exp=payload_dict.get("exp"),
            sid=payload_dict.get("sid"),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_user(
    payload: TokenPayload = Depends(get_token_payload),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Retrieves the authenticated user from the database matching the token's subject ID.
    Raises HTTP 401 Unauthorized if the user does not exist.
    """
    try:
        user_uuid = uuid.UUID(payload.sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier format.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token does not exist.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.sid and not await session_is_active(payload.sid, user_uuid, db):
        raise HTTPException(status_code=401, detail="Session has been revoked.",
                            headers={"WWW-Authenticate": "Bearer"})
    return user


# Bounded in-memory 30s TTL cache for verified active sessions (single-worker only).
# When WEB_CONCURRENCY > 1 without a shared cache backend, caching is bypassed so
# revoked sessions cannot remain valid across worker processes.
_ACTIVE_SESSION_CACHE: OrderedDict[Tuple[str, str], Tuple[float, bool]] = OrderedDict()
_ACTIVE_SESSION_CACHE_TTL = 30.0
_ACTIVE_SESSION_CACHE_MAX_SIZE = 2048


def _is_multi_worker_mode() -> bool:
    try:
        return int(os.getenv("WEB_CONCURRENCY", "1")) > 1
    except (TypeError, ValueError):
        return True


def _evict_expired_or_overflow(now: float) -> None:
    expired_keys = [k for k, (exp, _) in _ACTIVE_SESSION_CACHE.items() if now >= exp]
    for k in expired_keys:
        _ACTIVE_SESSION_CACHE.pop(k, None)
    while len(_ACTIVE_SESSION_CACHE) >= _ACTIVE_SESSION_CACHE_MAX_SIZE:
        _ACTIVE_SESSION_CACHE.popitem(last=False)


def register_active_session(session_id: Any = None, user_id: Any = None) -> None:
    """Pre-warm or refresh the active session cache entry in single-worker mode."""
    if _is_multi_worker_mode():
        return
    if session_id and user_id:
        now = time.time()
        _evict_expired_or_overflow(now)
        key = (str(session_id), str(user_id))
        _ACTIVE_SESSION_CACHE[key] = (now + _ACTIVE_SESSION_CACHE_TTL, True)
        _ACTIVE_SESSION_CACHE.move_to_end(key)


def invalidate_session_cache(session_id: Optional[Any] = None, user_id: Optional[Any] = None) -> None:
    """Evict active session cache entries immediately on logout, rotation, revocation, or password reset."""
    if session_id:
        sid_str = str(session_id)
        for key in [k for k in _ACTIVE_SESSION_CACHE if k[0] == sid_str]:
            _ACTIVE_SESSION_CACHE.pop(key, None)
    elif user_id:
        uid_str = str(user_id)
        for key in [k for k in _ACTIVE_SESSION_CACHE if k[1] == uid_str]:
            _ACTIVE_SESSION_CACHE.pop(key, None)
    else:
        _ACTIVE_SESSION_CACHE.clear()


async def session_is_active(session_id: str, user_id: uuid.UUID, db: AsyncSession) -> bool:
    try:
        identifier = uuid.UUID(str(session_id))
    except (ValueError, TypeError):
        return False

    sid_str = str(identifier)
    uid_str = str(user_id)
    cache_key = (sid_str, uid_str)
    use_cache = not _is_multi_worker_mode()
    now = time.time()

    if use_cache:
        cached = _ACTIVE_SESSION_CACHE.get(cache_key)
        if cached is not None:
            cached_expires, is_valid = cached
            if now < cached_expires:
                _ACTIVE_SESSION_CACHE.move_to_end(cache_key)
                return is_valid
            _ACTIVE_SESSION_CACHE.pop(cache_key, None)

    result = await db.execute(
        select(AuthSession.id).where(
            AuthSession.id == identifier,
            AuthSession.user_id == user_id,
            AuthSession.invalidated_at.is_(None),
            AuthSession.expires_at > datetime.now(timezone.utc),
        )
    )
    is_active = result.scalar_one_or_none() is not None
    if use_cache:
        _evict_expired_or_overflow(now)
        _ACTIVE_SESSION_CACHE[cache_key] = (now + _ACTIVE_SESSION_CACHE_TTL, is_active)
    return is_active


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensures the authenticated user account is active.
    Raises HTTP 400 Bad Request if deactivated.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )
    return current_user


def require_role(required_role: UserRole):
    """
    Dependency factory that restricts route access to users with a specific role.
    Admins are always permitted access to student endpoints.
    Raises HTTP 403 Forbidden if the user's role is not authorized.
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role != required_role and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: '{required_role.value}'.",
            )
        return current_user

    return role_checker


def require_roles(allowed_roles: List[UserRole]):
    """
    Dependency factory allowing any of the specified roles.
    Raises HTTP 403 Forbidden if the user's role is not in the allowed list.
    """
    async def multi_role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            role_names = ", ".join(r.value for r in allowed_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Allowed roles: [{role_names}].",
            )
        return current_user

    return multi_role_checker


async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Returns the authenticated user if a valid bearer token is provided;
    otherwise returns None for anonymous access.
    """
    if not token:
        return None
    payload_dict = decode_token(token)
    if not payload_dict or "sub" not in payload_dict:
        return None
    try:
        user_uuid = uuid.UUID(str(payload_dict.get("sub")))
        if payload_dict.get("sid") and not await session_is_active(payload_dict["sid"], user_uuid, db):
            return None
        result = await db.execute(select(User).where(User.id == user_uuid, User.is_active.is_(True)))
        return result.scalar_one_or_none()
    except Exception:
        return None
