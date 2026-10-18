import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, desc, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User, UserRole
from app.models.otp import OTPVerification
from app.models.password_reset import PasswordResetToken
from app.models.auth_session import AuthSession
from app.schemas.user import UserRead, UserCreate, UserLogin, GoogleLoginRequest, AuthResponse
from app.schemas.otp import (
    OTPRequest,
    OTPVerifyRequest,
    OTPResponse,
    OTPVerificationSuccessResponse,
)
from app.schemas.password_reset import (
    ForgotPasswordRequest,
    VerifyResetTokenRequest,
    ResetPasswordRequest,
    PasswordResetResponse,
)
from app.utils.otp import generate_secure_otp, hash_otp, verify_otp_hash
from app.services.email_service import EmailService
from app.api.dependencies.auth import (
    get_current_active_user,
    require_role,
    require_roles,
)
from app.core.rate_limiter import auth_rate_limiter

router = APIRouter(prefix="/auth", tags=["Authentication & Accounts"])
REFRESH_COOKIE_NAME = "career_platform_refresh"
logger = logging.getLogger(__name__)


@router.get('/config')
async def public_auth_config():
    # Google web client IDs are public identifiers, never API credentials.
    return {'google_client_id': settings.GOOGLE_CLIENT_ID}


async def set_refresh_cookie(response: Response, user: User, db: AsyncSession) -> str:
    """Store a rotated refresh credential where browser JavaScript cannot read it."""
    session_id = uuid.uuid4()
    refresh_token = create_refresh_token({"sub": str(user.id), "sid": str(session_id)})
    db.add(AuthSession(
        id=session_id, user_id=user.id,
        token_hash=hashlib.sha256(refresh_token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    await db.commit()
    is_production = settings.ENVIRONMENT.strip().lower() in {"production", "prod", "release"}
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax",
        path="/api/auth",
    )
    return create_access_token({
        "sub": str(user.id), "email": user.email, "role": user.role.value,
        "sid": str(session_id),
    })


def validate_session_origin(request: Request):
    """Cookie-authenticated mutations must originate from an allowed frontend."""
    origin = request.headers.get("origin")
    if origin and origin.rstrip("/") not in settings.ALLOWED_ORIGINS:
        raise HTTPException(status_code=403, detail="Session request origin is not allowed.")


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student or contributor account",
    dependencies=[Depends(auth_rate_limiter)],
)
async def register_user(
    user_in: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Registers a new user account with secure password hashing and unique email enforcement.
    Issues a session immediately. Email verification remains optional and can be
    completed later through the legacy OTP endpoints.
    """
    normalized_email = user_in.email.strip().lower()
    if normalized_email == settings.ADMIN_EMAIL.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This address is reserved for the administrator.",
        )

    # Verify email uniqueness
    existing_user_query = await db.execute(
        select(User).where(User.email == normalized_email)
    )
    if existing_user_query.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Securely hash the password
    hashed_password = get_password_hash(user_in.password)

    # Instantiate user model
    new_user = User(
        email=normalized_email,
        hashed_password=hashed_password,
        full_name=user_in.full_name.strip(),
        role=user_in.role,
        headline=user_in.headline,
        is_active=True,
        is_verified=False,
    )

    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)

    # Registration is intentionally independent of transactional email delivery.
    # Password-reset and other email workflows continue to use EmailService.
    access_token = await set_refresh_cookie(response, new_user, db)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=new_user,
        message="Account registered successfully. Welcome!",
    )


@router.post(
    "/resend-otp",
    response_model=OTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Resend a 6-digit email OTP with rate-limiting cooldown",
    dependencies=[Depends(auth_rate_limiter)],
)
@router.post(
    "/send-otp",
    response_model=OTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate and dispatch a 6-digit email OTP",
    dependencies=[Depends(auth_rate_limiter)],
)
async def send_or_resend_otp(
    req: OTPRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generates and emails a new 6-digit OTP.
    Enforces a 60-second cooldown period between successive OTP requests.
    """
    normalized_email = req.email.strip().lower()

    # Verify user exists
    user_query = await db.execute(
        select(User).where(User.email == normalized_email)
    )
    user = user_query.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address was found.",
        )

    if user.is_verified and req.purpose == "registration":
        return OTPResponse(
            success=True,
            message="Your account is already verified. You can log in directly.",
            email=normalized_email,
            cooldown_seconds=0,
            expires_in_seconds=0,
        )

    # Check resend cooldown on the most recent OTP
    recent_otp_query = await db.execute(
        select(OTPVerification)
        .where(
            OTPVerification.email == normalized_email,
            OTPVerification.purpose == req.purpose,
        )
        .order_by(desc(OTPVerification.created_at))
    )
    last_otp = recent_otp_query.scalars().first()

    now_utc = datetime.now(timezone.utc)
    if last_otp and last_otp.created_at:
        # Calculate elapsed seconds (handle tz-aware datetime)
        last_created = last_otp.created_at
        if last_created.tzinfo is None:
            last_created = last_created.replace(tzinfo=timezone.utc)
        elapsed = (now_utc - last_created).total_seconds()

        if elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting a new verification code.",
            )

    # Invalidate previous unexpired OTPs for this purpose
    previous_otps_query = await db.execute(
        select(OTPVerification).where(
            OTPVerification.email == normalized_email,
            OTPVerification.purpose == req.purpose,
            OTPVerification.invalidated_at.is_(None),
        )
    )
    for prev in previous_otps_query.scalars().all():
        prev.invalidated_at = now_utc

    # Generate new secure 6-digit OTP
    otp_code = generate_secure_otp(6)
    expires_at = now_utc + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    new_otp_record = OTPVerification(
        user_id=user.id,
        email=normalized_email,
        otp_hash=hash_otp(otp_code),
        purpose=req.purpose,
        attempt_count=0,
        max_attempts=settings.OTP_MAX_ATTEMPTS,
        expires_at=expires_at,
    )
    db.add(new_otp_record)
    await db.flush()

    # Dispatch email
    delivered = await EmailService.send_otp_email(
        to_email=normalized_email,
        otp_code=otp_code,
        recipient_name=user.full_name,
        purpose=req.purpose,
    )
    if not delivered:
        await db.rollback()
        raise HTTPException(status_code=503, detail="Verification email could not be delivered. Please try again later.")
    await db.commit()

    return OTPResponse(
        success=True,
        message="A new 6-digit verification code has been dispatched to your email.",
        email=normalized_email,
        cooldown_seconds=settings.OTP_RESEND_COOLDOWN_SECONDS,
        expires_in_seconds=settings.OTP_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/verify-otp",
    response_model=OTPVerificationSuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify 6-digit OTP code and activate account",
)
async def verify_otp(
    req: OTPVerifyRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Validates the submitted 6-digit OTP against the stored cryptographic hash.
    Enforces maximum attempt limits (max 5) and marks the account as verified upon success.
    """
    normalized_email = req.email.strip().lower()

    # Retrieve user
    user_query = await db.execute(
        select(User).where(User.email == normalized_email)
    )
    user = user_query.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )

    # Retrieve latest active OTP record for this email and purpose
    otp_query = await db.execute(
        select(OTPVerification)
        .where(
            OTPVerification.email == normalized_email,
            OTPVerification.purpose == req.purpose,
            OTPVerification.invalidated_at.is_(None),
        )
        .order_by(desc(OTPVerification.created_at))
    )
    otp_record = otp_query.scalars().first()

    now_utc = datetime.now(timezone.utc)

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found. Please request a new code.",
        )

    # Check expiration
    record_expires = otp_record.expires_at
    if record_expires.tzinfo is None:
        record_expires = record_expires.replace(tzinfo=timezone.utc)

    if now_utc > record_expires:
        otp_record.invalidated_at = now_utc
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code has expired. Please request a new code.",
        )

    # Check attempt limit
    if otp_record.attempt_count >= otp_record.max_attempts:
        otp_record.invalidated_at = now_utc
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new code.",
        )

    # Validate OTP hash
    if not verify_otp_hash(req.otp, otp_record.otp_hash):
        otp_record.attempt_count += 1
        if otp_record.attempt_count >= otp_record.max_attempts:
            otp_record.invalidated_at = now_utc
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect verification code. Maximum attempts reached. Please request a new code.",
            )
        await db.commit()
        remaining_attempts = otp_record.max_attempts - otp_record.attempt_count
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining_attempts} attempt(s) remaining.",
        )

    # Code matches: Invalidate OTP and verify user account
    otp_record.invalidated_at = now_utc
    user.is_verified = True
    await db.commit()
    await db.refresh(user)

    # Generate refreshed access token with verified status
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        }
    )
    access_token = await set_refresh_cookie(response, user, db)

    return OTPVerificationSuccessResponse(
        success=True,
        message="Account verified successfully! Welcome to Student Career Platform.",
        is_verified=True,
        user=user,
        access_token=access_token,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and issue JWT access token",
    dependencies=[Depends(auth_rate_limiter)],
)
async def login_user(
    credentials: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Validates user credentials against stored bcrypt password hashes.
    Dispatches a signed JWT bearer token on success.
    """
    normalized_email = credentials.email.strip().lower()
    using_admin_username = normalized_email == settings.ADMIN_USERNAME.strip().lower()
    if using_admin_username:
        normalized_email = settings.ADMIN_EMAIL.strip().lower()

    # Lookup user record
    result = await db.execute(
        select(User).where(User.email == normalized_email)
    )
    user = result.scalar_one_or_none()

    if (
        not user
        or (using_admin_username and user.role != UserRole.ADMIN)
        or not verify_password(credentials.password, user.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account has been deactivated. Please contact platform support.",
        )

    # Generate access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        }
    )
    access_token = await set_refresh_cookie(response, user, db)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user,
        message="Login successful. Welcome back!",
    )


@router.post(
    "/google",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate or register user using Google Cloud ID token",
    dependencies=[Depends(auth_rate_limiter), Depends(validate_session_origin)],
)
async def google_auth(
    req: GoogleLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Validates a Google ID token from Google Identity Services.
    If the user exists, logs them in; if not, registers a verified student account.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google authentication is not configured on this server.",
        )

    # The official verifier validates Google's signature, expiry, issuer, and
    # the configured OAuth web-client audience. Never log the credential.
    try:
        payload = await run_in_threadpool(
            google_id_token.verify_oauth2_token,
            req.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except (ValueError, GoogleAuthError):
        logger.warning("Google sign-in rejected: invalid token or claim validation failure")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google authentication credential.",
        )
    except Exception:
        logger.exception("Google sign-in verification service failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google authentication is temporarily unavailable.",
        )

    google_sub = payload.get("sub")
    google_email = payload.get("email")
    if not google_sub or not google_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account did not provide the required identity claims.",
        )

    # Ensure email is verified by Google
    email_verified = payload.get("email_verified")
    if email_verified not in (True, "true", "True", 1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google email address must be verified.",
        )

    normalized_email = google_email.strip().lower()

    # Prefer Google's immutable subject identifier for returning users. Only
    # fall back to email for first-time linking.
    user = (await db.execute(
        select(User).where(User.google_sub == google_sub)
    )).scalar_one_or_none()
    linking_by_email = user is None
    if linking_by_email:
        user = (await db.execute(
            select(User).where(User.email == normalized_email)
        )).scalar_one_or_none()

    if user:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account has been deactivated. Please contact platform support.",
            )
        if linking_by_email:
            # Avoid silently taking over a password account through a Google
            # account that uses a third-party email address. Google is
            # authoritative for Gmail and Workspace identities only.
            google_is_authoritative = normalized_email.endswith("@gmail.com") or bool(payload.get("hd"))
            if user.role == UserRole.ADMIN or not google_is_authoritative:
                logger.warning("Google automatic account linking refused for an existing account")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account already exists for this email. Sign in with your password to continue.",
                )
            if user.google_sub and user.google_sub != google_sub:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This email is already linked to another Google account.",
                )
            user.google_sub = google_sub

        # This flag records provider-backed email verification; it is not an
        # authorization gate for email/password accounts.
        user.is_verified = True
        # If user has no avatar and Google provides a picture, sync it
        picture = payload.get("picture")
        if picture and not user.avatar_url:
            user.avatar_url = picture
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            logger.warning("Google account linking conflict")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This Google identity is already linked to another account.",
            )
        await db.refresh(user)
    else:
        # Create a new user with verified student status
        full_name = payload.get("name") or normalized_email.split("@")[0].capitalize()
        user = User(
            email=normalized_email,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            full_name=full_name.strip(),
            role=UserRole.STUDENT,
            headline="Student Explorer",
            avatar_url=payload.get("picture"),
            is_active=True,
            is_verified=True,
            google_sub=google_sub,
        )
        db.add(user)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            logger.warning("Google sign-in registration conflict")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account for this Google identity already exists. Please retry sign-in.",
            )
        await db.refresh(user)

    # Issue access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        }
    )
    access_token = await set_refresh_cookie(response, user, db)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user,
        message="Google authentication successful. Welcome!",
    )


@router.post("/refresh", response_model=AuthResponse, status_code=status.HTTP_200_OK,
             dependencies=[Depends(validate_session_origin)])
async def refresh_session(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    """Rotate a valid refresh cookie and issue a fresh short-lived access token."""
    payload = decode_token(refresh_token, expected_type="refresh") if refresh_token else None
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh session is missing, invalid, or expired.",
        )

    try:
        user_id = uuid.UUID(str(payload["sub"]))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh session contains an invalid user identifier.",
        )

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The user session is no longer active.",
        )

    now = datetime.now(timezone.utc)
    consumed = await db.execute(update(AuthSession).where(
        AuthSession.user_id == user_id,
        AuthSession.token_hash == hashlib.sha256(refresh_token.encode()).hexdigest(),
        AuthSession.invalidated_at.is_(None),
        AuthSession.expires_at > now,
    ).values(invalidated_at=now).returning(AuthSession.id))
    if consumed.scalar_one_or_none() is None:
        await db.rollback()
        raise HTTPException(status_code=401, detail="Session has been revoked or already refreshed.")

    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
    })
    access_token = await set_refresh_cookie(response, user, db)
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user,
        message="Session refreshed successfully.",
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT,
             dependencies=[Depends(validate_session_origin)])
async def logout_user(
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    """End the browser session by removing its HttpOnly refresh credential."""
    is_production = settings.ENVIRONMENT.strip().lower() in {"production", "prod", "release"}
    if refresh_token:
        await db.execute(update(AuthSession).where(
            AuthSession.token_hash == hashlib.sha256(refresh_token.encode()).hexdigest(),
            AuthSession.invalidated_at.is_(None),
        ).values(invalidated_at=datetime.now(timezone.utc)))
        await db.commit()
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax",
        path="/api/auth",
    )
    return response


@router.post(
    "/forgot-password",
    response_model=PasswordResetResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a password recovery email link",
    dependencies=[Depends(auth_rate_limiter)],
)
async def forgot_password(
    req: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Initiates the self-serve password recovery workflow.
    To prevent account enumeration attacks, always responds with a success message.
    """
    normalized_email = req.email.strip().lower()

    user_query = await db.execute(
        select(User).where(User.email == normalized_email)
    )
    user = user_query.scalar_one_or_none()

    if user and user.is_active:
        now_utc = datetime.now(timezone.utc)

        # Invalidate any previous unexpired reset tokens for this user
        prev_tokens_query = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.invalidated_at.is_(None),
            )
        )
        for prev in prev_tokens_query.scalars().all():
            prev.invalidated_at = now_utc

        # Generate cryptographically secure URL-safe token (32 bytes = 43 chars base64)
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = now_utc + timedelta(minutes=15)

        reset_record = PasswordResetToken(
            user_id=user.id,
            email=normalized_email,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(reset_record)
        await db.flush()

        # Dispatch reset email
        delivered = await EmailService.send_password_reset_email(
            to_email=normalized_email,
            reset_token=raw_token,
            recipient_name=user.full_name,
        )
        if delivered:
            await db.commit()
        else:
            await db.rollback()

    return PasswordResetResponse(
        success=True,
        message="If an account with that email exists, we have sent a password reset link to your inbox. If it does not arrive, please try again later.",
    )


@router.post(
    "/verify-reset-token",
    status_code=status.HTTP_200_OK,
    summary="Validate that a password reset token is active and unexpired",
)
async def verify_reset_token(
    req: VerifyResetTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verifies that a password reset link token is valid before rendering the reset form.
    """
    normalized_email = req.email.strip().lower()
    token_hash = hashlib.sha256(req.token.encode("utf-8")).hexdigest()

    query = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.email == normalized_email,
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.invalidated_at.is_(None),
        )
    )
    token_record = query.scalar_one_or_none()

    now_utc = datetime.now(timezone.utc)
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link is invalid or has already been used.",
        )

    record_expires = token_record.expires_at
    if record_expires.tzinfo is None:
        record_expires = record_expires.replace(tzinfo=timezone.utc)

    if now_utc > record_expires:
        token_record.invalidated_at = now_utc
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link has expired. Please request a new link.",
        )

    return {
        "valid": True,
        "email": normalized_email,
        "message": "Reset token is valid.",
    }


@router.post(
    "/reset-password",
    response_model=PasswordResetResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit new password with verified reset token",
)
async def reset_password(
    req: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Completes password recovery by hashing the new password, updating the user record,
    and invalidating the single-use reset token immediately.
    """
    normalized_email = req.email.strip().lower()
    token_hash = hashlib.sha256(req.token.encode("utf-8")).hexdigest()

    query = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.email == normalized_email,
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.invalidated_at.is_(None),
        )
    )
    token_record = query.scalar_one_or_none()

    now_utc = datetime.now(timezone.utc)
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link is invalid or has already been used.",
        )

    record_expires = token_record.expires_at
    if record_expires.tzinfo is None:
        record_expires = record_expires.replace(tzinfo=timezone.utc)

    if now_utc > record_expires:
        token_record.invalidated_at = now_utc
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link has expired. Please request a new link.",
        )

    # Fetch user
    user_query = await db.execute(
        select(User).where(User.id == token_record.user_id)
    )
    user = user_query.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account associated with this token was not found.",
        )

    # Hash new password securely
    user.hashed_password = get_password_hash(req.new_password)
    await db.execute(update(AuthSession).where(
        AuthSession.user_id == user.id, AuthSession.invalidated_at.is_(None),
    ).values(invalidated_at=now_utc))
    # Single-use consumption
    token_record.invalidated_at = now_utc

    await db.commit()

    return PasswordResetResponse(
        success=True,
        message="Your password has been successfully reset. You can now sign in with your new password.",
    )


@router.get("/me", response_model=UserRead, status_code=status.HTTP_200_OK)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the authenticated user's profile.
    Requires a valid Bearer token.
    """
    return current_user


@router.get("/student-only", status_code=status.HTTP_200_OK)
async def verify_student_access(
    current_user: User = Depends(
        require_roles([UserRole.STUDENT, UserRole.CONTRIBUTOR, UserRole.ADMIN])
    ),
):
    """
    Protected route accessible by career-workspace users and administrators.
    """
    return {
        "success": True,
        "message": f"Welcome, student {current_user.full_name}. Student workspace access granted.",
        "role": current_user.role,
    }


@router.get("/admin-only", status_code=status.HTTP_200_OK)
async def verify_admin_access(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """
    Protected route strictly accessible only by ADMIN role.
    """
    return {
        "success": True,
        "message": f"Welcome, admin {current_user.full_name}. Administrative clearance verified.",
        "role": current_user.role,
    }
