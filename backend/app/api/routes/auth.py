import asyncio
import hashlib
import json
import logging
import secrets
import time
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, desc, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload
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
from app.models.password_reset import PasswordResetToken, PasswordResetOTP
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
    ForgotPasswordResponse,
    VerifyResetOTPRequest,
    VerifyResetOTPResponse,
    VerifyResetTokenRequest,
    ResetPasswordRequest,
    PasswordResetResponse,
)
from app.services.email_service import EmailService
from app.api.dependencies.auth import (
    get_current_active_user,
    require_role,
    require_roles,
    register_active_session,
    invalidate_session_cache,
)
from app.core.rate_limiter import auth_rate_limiter

router = APIRouter(prefix="/auth", tags=["Authentication & Accounts"])
REFRESH_COOKIE_NAME = "career_platform_refresh"
logger = logging.getLogger(__name__)


def login_database_unavailable() -> HTTPException:
    """Return a stable, non-sensitive contract for authentication DB outages."""
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "code": "AUTH_DATABASE_UNAVAILABLE",
            "message": "The sign-in service cannot reach its database right now. Please try again shortly.",
        },
    )


async def rollback_quietly(db: AsyncSession) -> None:
    """Best-effort cleanup without masking the stable outage response."""
    try:
        await db.rollback()
    except Exception:
        logger.warning("Database rollback also failed during login outage", exc_info=True)


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
    register_active_session(session_id, user.id)
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
    origin = request.headers.get("origin") or request.headers.get("referer")
    if not origin:
        return
    parsed = urlparse(origin)
    clean_origin = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
    if clean_origin in settings.ALLOWED_ORIGINS:
        return
    netloc = parsed.netloc.lower()
    is_valid_preview = (
        netloc == "aspirepath.vercel.app"
        or (netloc.startswith("aspirepath-") and netloc.endswith(".vercel.app"))
    )
    if is_valid_preview:
        return
    if settings.RENDER_EXTERNAL_URL and clean_origin == settings.RENDER_EXTERNAL_URL.rstrip("/"):
        return
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
    hashed_password = await run_in_threadpool(get_password_hash, user_in.password)

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
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )
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
    status_code=status.HTTP_410_GONE,
    summary="[Deprecated] Legacy OTP verification retired",
)
@router.post(
    "/send-otp",
    response_model=OTPResponse,
    status_code=status.HTTP_410_GONE,
    summary="[Deprecated] Legacy OTP verification retired",
)
async def send_or_resend_otp(req: OTPRequest = None):
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="OTP verification has been retired. Student accounts are active immediately upon registration.",
    )


@router.post(
    "/verify-otp",
    response_model=OTPVerificationSuccessResponse,
    status_code=status.HTTP_410_GONE,
    summary="[Deprecated] Legacy OTP verification retired",
)
async def verify_otp(req: OTPVerifyRequest = None):
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="OTP verification has been retired. Student accounts are active immediately upon registration.",
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
    t0 = time.perf_counter()
    normalized_email = credentials.email.strip().lower()
    using_admin_username = normalized_email == settings.ADMIN_USERNAME.strip().lower()

    t_lookup_start = time.perf_counter()
    candidate_timings = []
    if using_admin_username:
        configured_admin_emails = []
        if hasattr(settings, "ADMIN_EMAILS") and settings.ADMIN_EMAILS:
            for em in settings.ADMIN_EMAILS:
                em_clean = str(em).strip().lower()
                if em_clean and em_clean not in configured_admin_emails:
                    configured_admin_emails.append(em_clean)
        if settings.ADMIN_EMAIL:
            ae = settings.ADMIN_EMAIL.strip().lower()
            if ae and ae not in configured_admin_emails:
                configured_admin_emails.append(ae)

        # Dynamically query all active platform administrators
        try:
            result = await db.execute(
                select(User)
                .options(noload(User.profile))
                .where(
                    User.role == UserRole.ADMIN,
                    User.is_active == True,
                )
            )
        except SQLAlchemyError:
            logger.exception("Database unavailable during admin login lookup")
            await rollback_quietly(db)
            raise login_database_unavailable()
        admins = result.scalars().all()
        admin_map = {a.email.strip().lower(): a for a in admins}
        # Order candidates: configured admin emails first by priority, then any remaining active admins
        ordered_candidates = [admin_map[em] for em in configured_admin_emails if em in admin_map]
        prioritized_admin_ids = {candidate.id for candidate in ordered_candidates}
        ordered_candidates.extend(admin for admin in admins if admin.id not in prioritized_admin_ids)

        t_lookup_ms = round((time.perf_counter() - t_lookup_start) * 1000, 2)
        
        user = None
        password_valid = False
        t_pw_start = time.perf_counter()

        async def verify_admin_candidate(idx, candidate):
            c_start = time.perf_counter()
            matched = await run_in_threadpool(
                verify_password, credentials.password, candidate.hashed_password
            )
            c_dur = round((time.perf_counter() - c_start) * 1000, 2)
            return candidate, matched, {
                "candidate_index": idx,
                "verified": matched,
                "duration_ms": c_dur,
            }

        # A shared administrator alias may map to multiple real accounts. Verify
        # the small, rate-limited candidate set concurrently so latency does not
        # grow by one full bcrypt operation for every administrator.
        verification_results = await asyncio.gather(*(
            verify_admin_candidate(idx, candidate)
            for idx, candidate in enumerate(ordered_candidates)
        ))
        for candidate, matched, candidate_timing in verification_results:
            candidate_timings.append(candidate_timing)
            if matched:
                user = candidate
                password_valid = True
                break
        t_pw_ms = round((time.perf_counter() - t_pw_start) * 1000, 2)
    else:
        # Lookup user record
        try:
            result = await db.execute(
                select(User)
                .options(noload(User.profile))
                .where(User.email == normalized_email)
            )
        except SQLAlchemyError:
            logger.exception("Database unavailable during login lookup")
            await rollback_quietly(db)
            raise login_database_unavailable()
        user = result.scalar_one_or_none()
        t_lookup_ms = round((time.perf_counter() - t_lookup_start) * 1000, 2)
        
        t_pw_start = time.perf_counter()
        password_valid = bool(user) and await run_in_threadpool(
            verify_password, credentials.password, user.hashed_password
        )
        t_pw_ms = round((time.perf_counter() - t_pw_start) * 1000, 2)
        if user:
            candidate_timings.append({
                "candidate_index": 0,
                "verified": password_valid,
                "duration_ms": t_pw_ms,
            })

    if (
        not user
        or (using_admin_username and user.role != UserRole.ADMIN)
        or not password_valid
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

    # Generate access token and set HttpOnly refresh cookie
    t_session_start = time.perf_counter()
    try:
        access_token = await set_refresh_cookie(response, user, db)
    except SQLAlchemyError:
        logger.exception("Database unavailable while creating login session")
        await rollback_quietly(db)
        raise login_database_unavailable()
    t_session_ms = round((time.perf_counter() - t_session_start) * 1000, 2)

    t_total_ms = round((time.perf_counter() - t0) * 1000, 2)
    timings = {
        "db_lookup_ms": t_lookup_ms,
        "password_verify_ms": t_pw_ms,
        "candidates_evaluated": len(candidate_timings),
        "refresh_session_and_commit_ms": t_session_ms,
        "total_login_ms": t_total_ms,
    }
    response.headers["X-Login-Breakdown"] = json.dumps(timings)
    response.headers["Server-Timing"] = (
        f"lookup;dur={t_lookup_ms}, "
        f"bcrypt;dur={t_pw_ms}, "
        f"session;dur={t_session_ms}, "
        f"total;dur={t_total_ms}"
    )
    logger.info("Login timing breakdown: %s", timings)

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
            hashed_password=await run_in_threadpool(
                get_password_hash, secrets.token_urlsafe(32)
            ),
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

    user = (await db.execute(
        select(User).options(noload(User.profile)).where(User.id == user_id)
    )).scalar_one_or_none()
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
    consumed_sid = consumed.scalar_one_or_none()
    if consumed_sid is None:
        await db.rollback()
        raise HTTPException(status_code=401, detail="Session has been revoked or already refreshed.")
    invalidate_session_cache(session_id=consumed_sid, user_id=user.id)

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
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    """End the browser session by removing its HttpOnly refresh credential."""
    is_production = settings.ENVIRONMENT.strip().lower() in {"production", "prod", "release"}
    if refresh_token:
        try:
            decoded = decode_token(refresh_token, expected_type="refresh")
            if decoded:
                invalidate_session_cache(session_id=decoded.get("sid"), user_id=decoded.get("sub"))
            revoked = await db.execute(update(AuthSession).where(
                AuthSession.token_hash == hashlib.sha256(refresh_token.encode()).hexdigest(),
                AuthSession.invalidated_at.is_(None),
            ).values(invalidated_at=datetime.now(timezone.utc)).returning(AuthSession.id))
            revoked_sid = revoked.scalar_one_or_none()
            await db.commit()
            if revoked_sid:
                invalidate_session_cache(session_id=revoked_sid)
        except Exception as e:
            logger.warning("Session revocation error during logout: %s", e)
            await db.rollback()
    response.status_code = status.HTTP_204_NO_CONTENT
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax",
        path="/api/auth",
    )
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax",
        path="/",
    )
    return response


@router.post(
    "/forgot-password",
    response_model=PasswordResetResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a 6-digit password recovery OTP via email",
    dependencies=[Depends(auth_rate_limiter)],
)
async def forgot_password(
    req: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Step 1: Initiates password recovery by generating a cryptographically secure
    6-digit OTP, storing its hash (valid for 5 minutes), and dispatching via Resend.
    To prevent account enumeration, always responds with a generic confirmation message.
    """
    normalized_email = req.email.strip().lower()

    user_query = await db.execute(
        select(User).where(User.email == normalized_email)
    )
    user = user_query.scalar_one_or_none()

    if user and user.is_active:
        now_utc = datetime.now(timezone.utc)

        # 1. Invalidate any previous unexpired OTPs for this user
        prev_otps_query = await db.execute(
            select(PasswordResetOTP).where(
                PasswordResetOTP.email == normalized_email,
                PasswordResetOTP.invalidated_at.is_(None),
                PasswordResetOTP.is_used == False,
            )
        )
        for prev_otp in prev_otps_query.scalars().all():
            prev_otp.invalidated_at = now_utc

        # 2. Invalidate previous legacy reset tokens
        prev_tokens_query = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.invalidated_at.is_(None),
            )
        )
        for prev in prev_tokens_query.scalars().all():
            prev.invalidated_at = now_utc

        # 3. Generate cryptographically secure random 6-digit OTP
        raw_otp = f"{secrets.randbelow(900000) + 100000:06d}"
        otp_hash = hashlib.sha256(raw_otp.encode("utf-8")).hexdigest()
        otp_expires_at = now_utc + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

        otp_record = PasswordResetOTP(
            user_id=user.id,
            email=normalized_email,
            otp_hash=otp_hash,
            attempt_count=0,
            max_attempts=settings.OTP_MAX_ATTEMPTS,
            expires_at=otp_expires_at,
            is_verified=False,
            is_used=False,
        )
        db.add(otp_record)

        # Also store token for legacy URL links
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        token_expires_at = now_utc + timedelta(minutes=15)
        reset_record = PasswordResetToken(
            user_id=user.id,
            email=normalized_email,
            token_hash=token_hash,
            expires_at=token_expires_at,
        )
        db.add(reset_record)
        await db.flush()

        if EmailService._development_dispatch():
            EmailService.record_dev_reset_token(normalized_email, raw_token)

        # 4. Dispatch 6-digit OTP email via Resend
        delivered = await EmailService.send_password_reset_otp_email(
            to_email=normalized_email,
            otp_code=raw_otp,
            recipient_name=user.full_name or "Student",
        )
        if delivered:
            await db.commit()
        else:
            await db.rollback()
            logger.error("[AUTH] Failed to dispatch password reset OTP email for %s", normalized_email)

    return ForgotPasswordResponse(
        success=True,
        message="If an account with that email exists, we have sent a 6-digit verification code to your inbox.",
        cooldown_seconds=settings.OTP_RESEND_COOLDOWN_SECONDS,
    )


@router.post(
    "/verify-reset-otp",
    response_model=VerifyResetOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Step 2: Verify 6-digit OTP and issue a single-purpose password reset token",
    dependencies=[Depends(auth_rate_limiter)],
)
async def verify_reset_otp(
    req: VerifyResetOTPRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Step 2: Verifies the 6-digit OTP against the stored SHA-256 hash.
    Enforces maximum 5 attempts, 5-minute expiration, and single-use invalidation.
    Returns a short-lived single-purpose reset token upon verification.
    """
    normalized_email = req.email.strip().lower()
    now_utc = datetime.now(timezone.utc)

    # Find the most recent active OTP record for this email
    query = await db.execute(
        select(PasswordResetOTP)
        .where(
            PasswordResetOTP.email == normalized_email,
            PasswordResetOTP.is_verified == False,
            PasswordResetOTP.is_used == False,
            PasswordResetOTP.invalidated_at.is_(None),
        )
        .order_by(desc(PasswordResetOTP.created_at))
    )
    otp_record = query.scalars().first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found for this email. Please request a new code.",
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
            detail="This verification code has expired. Please request a new code.",
        )

    # Check attempt limit
    if otp_record.attempt_count >= otp_record.max_attempts:
        otp_record.invalidated_at = now_utc
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new code.",
        )

    # Verify OTP hash
    provided_hash = hashlib.sha256(req.otp.encode("utf-8")).hexdigest()
    if provided_hash != otp_record.otp_hash:
        otp_record.attempt_count += 1
        remaining = otp_record.max_attempts - otp_record.attempt_count
        if remaining <= 0:
            otp_record.invalidated_at = now_utc
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect verification code. Maximum attempts exceeded. Please request a new code.",
            )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining.",
        )

    # Verification successful: issue single-purpose reset token
    otp_record.is_verified = True
    otp_record.verified_at = now_utc

    raw_reset_token = secrets.token_urlsafe(32)
    reset_token_hash = hashlib.sha256(raw_reset_token.encode("utf-8")).hexdigest()
    otp_record.reset_token_hash = reset_token_hash
    otp_record.reset_token_expires_at = now_utc + timedelta(minutes=15)

    await db.commit()

    return VerifyResetOTPResponse(
        success=True,
        reset_token=raw_reset_token,
        message="Verification code confirmed successfully. Please create your new password.",
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
    Checks both modern OTP reset tokens and legacy URL tokens.
    """
    normalized_email = req.email.strip().lower()
    token_hash = hashlib.sha256(req.token.encode("utf-8")).hexdigest()
    now_utc = datetime.now(timezone.utc)

    # 1. Check PasswordResetOTP reset tokens
    otp_query = await db.execute(
        select(PasswordResetOTP).where(
            PasswordResetOTP.email == normalized_email,
            PasswordResetOTP.reset_token_hash == token_hash,
            PasswordResetOTP.is_verified == True,
            PasswordResetOTP.is_used == False,
            PasswordResetOTP.invalidated_at.is_(None),
        )
    )
    otp_record = otp_query.scalars().first()
    if otp_record:
        if otp_record.is_reset_token_expired:
            otp_record.invalidated_at = now_utc
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The password reset session has expired. Please request a new verification code.",
            )
        return {
            "valid": True,
            "email": normalized_email,
            "message": "Reset token is valid.",
        }

    # 2. Check legacy PasswordResetToken
    query = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.email == normalized_email,
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.invalidated_at.is_(None),
        )
    )
    token_record = query.scalar_one_or_none()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset token is invalid or has already been used.",
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
    summary="Step 3: Submit new password with verified reset token",
)
async def reset_password(
    req: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Step 3: Completes password recovery by hashing the new password, updating the user record,
    invalidating the single-use reset token and OTP records, and revoking existing sessions.
    """
    normalized_email = req.email.strip().lower()
    raw_token = req.effective_token
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now_utc = datetime.now(timezone.utc)

    target_user_id = None
    matched_otp_record = None
    matched_token_record = None

    # 1. Check modern PasswordResetOTP record
    otp_query = await db.execute(
        select(PasswordResetOTP).where(
            PasswordResetOTP.email == normalized_email,
            PasswordResetOTP.reset_token_hash == token_hash,
            PasswordResetOTP.is_verified == True,
            PasswordResetOTP.is_used == False,
            PasswordResetOTP.invalidated_at.is_(None),
        )
    )
    matched_otp_record = otp_query.scalars().first()

    if matched_otp_record:
        if matched_otp_record.is_reset_token_expired:
            matched_otp_record.invalidated_at = now_utc
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The password reset session has expired. Please request a new verification code.",
            )
        target_user_id = matched_otp_record.user_id

    # 2. Fallback to legacy PasswordResetToken
    if not target_user_id:
        token_query = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.email == normalized_email,
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.invalidated_at.is_(None),
            )
        )
        matched_token_record = token_query.scalar_one_or_none()
        if matched_token_record:
            rec_expires = matched_token_record.expires_at
            if rec_expires.tzinfo is None:
                rec_expires = rec_expires.replace(tzinfo=timezone.utc)
            if now_utc > rec_expires:
                matched_token_record.invalidated_at = now_utc
                await db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The password reset link has expired. Please request a new link.",
                )
            target_user_id = matched_token_record.user_id

    if not target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset token is invalid, expired, or has already been used.",
        )

    # 3. Fetch user and update password
    user_query = await db.execute(
        select(User).where(User.id == target_user_id)
    )
    user = user_query.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account associated with this token was not found.",
        )

    # 4. Hash new password securely with bcrypt
    user.hashed_password = await run_in_threadpool(get_password_hash, req.new_password)

    # 5. Revoke all existing sessions for this user for security
    await db.execute(
        update(AuthSession)
        .where(AuthSession.user_id == user.id, AuthSession.invalidated_at.is_(None))
        .values(invalidated_at=now_utc)
    )

    # 6. Mark single-use consumption and invalidate all other OTPs for this user
    if matched_otp_record:
        matched_otp_record.is_used = True
        matched_otp_record.used_at = now_utc
        matched_otp_record.invalidated_at = now_utc

    if matched_token_record:
        matched_token_record.invalidated_at = now_utc

    # Invalidate all remaining OTPs for this email
    await db.execute(
        update(PasswordResetOTP)
        .where(PasswordResetOTP.email == normalized_email, PasswordResetOTP.invalidated_at.is_(None))
        .values(invalidated_at=now_utc)
    )

    await db.commit()
    invalidate_session_cache(user_id=user.id)

    return PasswordResetResponse(
        success=True,
        message="Your password has been reset successfully!",
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
