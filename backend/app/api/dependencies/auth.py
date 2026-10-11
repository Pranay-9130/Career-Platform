import uuid
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
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

    return user


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
        result = await db.execute(select(User).where(User.id == user_uuid))
        return result.scalar_one_or_none()
    except Exception:
        return None
