import asyncio
import logging
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Optional
from urllib.parse import urlencode
import httpx

from app.core.config import settings

logger = logging.getLogger("career_platform.email")


class EmailService:
    """
    Transactional email service abstraction handling OTP dispatches,
    notifications, and account security verification messages.
    Supports configurable providers: SMTP, Resend, SendGrid, and Console fallback.
    """
    # Development in-memory registry of last dispatched OTPs and reset tokens for test verification
    _dev_otp_store: Dict[str, str] = {}
    _dev_reset_token_store: Dict[str, str] = {}

    @staticmethod
    def _development_dispatch() -> bool:
        return settings.ENVIRONMENT.strip().lower() not in {"production", "prod", "release"}

    @staticmethod
    def _log_api_failure(provider: str, error: Exception) -> None:
        """Log actionable diagnostics without response bodies, keys, or OTPs."""
        if isinstance(error, httpx.HTTPStatusError):
            status = error.response.status_code
            hint = {
                400: "Check the sender address and email payload in the provider dashboard.",
                401: "Check EMAIL_API_KEY in the deployment environment.",
                403: "Check sender/domain verification, API key permissions, and test-recipient restrictions.",
                422: "Check the sender address and email payload in the provider dashboard.",
                429: "Check the provider sending quota and rate limits.",
            }.get(status, "Check provider availability and its dashboard logs.")
            logger.error("%s dispatch failed (HTTP %s). %s", provider, status, hint)
        else:
            logger.error("%s dispatch failed (%s). Check outbound HTTPS connectivity and provider availability.",
                         provider, type(error).__name__)

    @classmethod
    async def _dispatch_email(
        cls,
        to_email: str,
        subject: str,
        html_body: str,
    ) -> bool:
        """
        Internal dispatcher routing outbound emails through configured provider:
        - "smtp": Standard SMTP (Gmail App Password, Brevo, AWS SES, Mailgun, etc.)
        - "resend": Resend REST API
        - "sendgrid": SendGrid v3 Mail Send API
        - "console" / fallback: Logs and stores in dev registries
        """
        provider = (settings.EMAIL_PROVIDER or "console").strip().lower()

        # 1. SMTP Provider
        if provider == "smtp":
            if not settings.SMTP_HOST:
                logger.warning(
                    "[EMAIL SERVICE] EMAIL_PROVIDER is 'smtp' but SMTP_HOST is empty. Falling back to console dispatch."
                )
                return cls._development_dispatch()
            try:
                def _send_sync():
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = subject
                    msg["From"] = settings.EMAIL_FROM
                    msg["To"] = to_email
                    plain_text = re.sub(r"<[^>]+>", "", html_body)
                    msg.attach(MIMEText(plain_text, "plain"))
                    msg.attach(MIMEText(html_body, "html"))

                    if settings.SMTP_USE_SSL:
                        server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                    else:
                        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                        if settings.SMTP_USE_TLS:
                            server.starttls()

                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

                    server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
                    server.quit()

                await asyncio.to_thread(_send_sync)
                logger.info(f"[EMAIL SERVICE] Successfully sent email to {to_email} via SMTP ({settings.SMTP_HOST})")
                return True
            except Exception as e:
                logger.error("SMTP dispatch failed (%s).", type(e).__name__)
                if settings.RENDER_EXTERNAL_URL and settings.SMTP_PORT in {25, 465, 587}:
                    logger.error("Render free services block standard SMTP ports. Configure an HTTPS email provider such as Resend or SendGrid, or use a paid service.")
                return False

        # 2. Resend Provider (Native Async HTTPS + SDK Fallback)
        elif provider == "resend":
            api_key = (settings.EMAIL_API_KEY or settings.RESEND_API_KEY or "").strip()
            if not api_key:
                logger.error(
                    "[EMAIL SERVICE] Resend dispatch failed: RESEND_API_KEY is not configured in environment variables. "
                    "Configure RESEND_API_KEY in your deployment environment."
                )
                if cls._development_dispatch():
                    logger.warning("[EMAIL SERVICE DEV] Simulating delivery in development mode.")
                    return True
                return False

            # Configure sender address: use custom verified domain if provided, otherwise default to onboarding@resend.dev
            configured_sender = (settings.EMAIL_FROM or "").strip()
            if not configured_sender or "@careerplatform.com" in configured_sender or "@example.com" in configured_sender:
                sender = "AspirePath <onboarding@resend.dev>"
            else:
                sender = configured_sender

            # Primary: Native async HTTPX client to Resend REST API (non-blocking, fast)
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        "https://api.resend.com/emails",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "from": sender,
                            "to": [to_email],
                            "subject": subject,
                            "html": html_body,
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    res_id = data.get("id", "sent")
                    logger.info(f"[EMAIL SERVICE] Successfully dispatched email to {to_email} via Resend API (ID: {res_id})")
                    return True
            except httpx.HTTPStatusError as http_err:
                cls._log_api_failure("Resend", http_err)
                return False
            except Exception as net_err:
                logger.warning("[EMAIL SERVICE] HTTPX dispatch failed (%s), attempting Resend SDK fallback...", net_err)
                # Fallback: Official Resend SDK
                try:
                    import resend
                    resend.api_key = api_key
                    params = {
                        "from": sender,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_body,
                    }
                    result = await asyncio.to_thread(resend.Emails.send, params)
                    res_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", "sent")
                    logger.info(f"[EMAIL SERVICE] Successfully dispatched email to {to_email} via Resend SDK (ID: {res_id})")
                    return True
                except Exception as sdk_err:
                    cls._log_api_failure("Resend SDK", sdk_err)
                    return False

        # 3. SendGrid REST API Provider
        elif provider == "sendgrid":
            if not settings.EMAIL_API_KEY:
                logger.warning(
                    "[EMAIL SERVICE] EMAIL_PROVIDER is 'sendgrid' but EMAIL_API_KEY is not set. Falling back to console dispatch."
                )
                return cls._development_dispatch()
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.sendgrid.com/v3/mail/send",
                        headers={
                            "Authorization": f"Bearer {settings.EMAIL_API_KEY}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "personalizations": [{"to": [{"email": to_email}]}],
                            "from": {"email": settings.EMAIL_FROM},
                            "subject": subject,
                            "content": [{"type": "text/html", "value": html_body}],
                        },
                    )
                    resp.raise_for_status()
                    logger.info(f"[EMAIL SERVICE] Successfully dispatched email to {to_email} via SendGrid API")
                    return True
            except Exception as e:
                cls._log_api_failure("SendGrid", e)
                return False

        # 4. Console / Test Simulation Fallback
        if provider != "console" or not cls._development_dispatch():
            logger.error("Email provider is unavailable or console delivery is disabled in production.")
            return False
        logger.info(f"[EMAIL SERVICE CONSOLE] Simulated dispatch to {to_email} (Subject: '{subject}')")
        return True

    @classmethod
    async def send_otp_email(
        cls,
        to_email: str,
        otp_code: str,
        recipient_name: str = "Student",
        purpose: str = "registration",
    ) -> bool:
        """
        Dispatches an OTP verification code to the user's email address.
        """
        normalized_email = to_email.strip().lower()
        if cls._development_dispatch():
            cls._dev_otp_store[normalized_email] = otp_code

        subject_map = {
            "registration": "Verify Your Career Platform Account",
            "login": "Your Security Login Verification Code",
            "password_reset": "Reset Your Career Platform Password",
        }
        subject = subject_map.get(purpose, "Your Verification Code")

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F8FBFF; color: #0F172A; margin: 0; padding: 24px; }}
            .card {{ max-width: 500px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #DBEAFE; padding: 32px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.05); }}
            .brand {{ font-size: 20px; font-weight: 800; color: #3B82F6; margin-bottom: 20px; text-align: center; }}
            .title {{ font-size: 22px; font-weight: 700; color: #0F172A; text-align: center; margin-bottom: 8px; }}
            .subtitle {{ font-size: 14px; color: #64748B; text-align: center; margin-bottom: 24px; line-height: 1.5; }}
            .otp-box {{ background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }}
            .otp-code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1D4ED8; font-family: monospace; }}
            .warning {{ font-size: 12px; color: #94A3B8; text-align: center; margin-top: 20px; line-height: 1.4; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">CareerPlatform</div>
            <h1 class="title">Verify Your Email</h1>
            <p class="subtitle">Hello {recipient_name}, please use the 6-digit code below to complete your {purpose} verification.</p>
            <div class="otp-box">
              <div class="otp-code">{otp_code}</div>
            </div>
            <p class="subtitle">This code is valid for <strong>5 minutes</strong>. For security, never share this code with anyone.</p>
            <p class="warning">If you did not request this verification code, you can safely ignore this email.</p>
          </div>
        </body>
        </html>
        """

        # Log dispatch in development/test environment
        logger.info(
            f"[EMAIL SERVICE] Dispatching OTP to {normalized_email} (purpose: {purpose}). "
            f"Expiry: {settings.OTP_EXPIRE_MINUTES}m"
        )
        if cls._development_dispatch():
            print(f"\n[EMAIL SERVICE DEV DISPATCH] Recipient: {normalized_email} | OTP: {otp_code} | Purpose: {purpose}\n")

        # Provider dispatch
        return await cls._dispatch_email(
            to_email=normalized_email,
            subject=subject,
            html_body=html_body,
        )

    @classmethod
    async def send_password_reset_otp_email(
        cls,
        to_email: str,
        otp_code: str,
        recipient_name: str = "Student",
    ) -> bool:
        """
        Dispatches a secure 6-digit OTP verification email for AspirePath password reset.
        Uses exact user-required template and Resend API.
        """
        normalized_email = to_email.strip().lower()
        if cls._development_dispatch():
            cls._dev_otp_store[normalized_email] = otp_code

        subject = "AspirePath – Your Password Reset OTP"

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 32px 16px; -webkit-font-smoothing: antialiased; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); }}
    .brand-header {{ text-align: center; margin-bottom: 28px; }}
    .brand-logo {{ font-size: 24px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px; text-decoration: none; }}
    .brand-tagline {{ font-size: 12px; color: #64748B; margin-top: 4px; font-weight: 500; }}
    .greeting {{ font-size: 15px; color: #1E293B; line-height: 1.6; margin-bottom: 16px; }}
    .content-text {{ font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 24px; }}
    .otp-card {{ background: #F0F7FF; border: 1.5px solid #BFDBFE; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 28px 0; }}
    .otp-label {{ font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1D4ED8; margin-bottom: 8px; }}
    .otp-digits {{ font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #1E40AF; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; padding-left: 10px; }}
    .expiry-badge {{ display: inline-block; margin-top: 10px; font-size: 12px; font-weight: 600; color: #B45309; background: #FEF3C7; padding: 4px 12px; border-radius: 9999px; }}
    .security-note {{ font-size: 13px; color: #64748B; line-height: 1.5; margin: 20px 0; padding-top: 16px; border-top: 1px solid #F1F5F9; }}
    .signature {{ font-size: 14px; font-weight: 600; color: #1E293B; margin-top: 24px; }}
    .footer {{ font-size: 12px; color: #94A3B8; text-align: center; margin-top: 32px; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <div class="brand-logo">AspirePath</div>
      <div class="brand-tagline">From your first project to your first job</div>
    </div>

    <p class="greeting">Hello,</p>
    
    <p class="content-text">
      We received a request to reset your AspirePath account password.
    </p>

    <div class="otp-card">
      <div class="otp-label">Your Verification Code</div>
      <div class="otp-digits">{otp_code}</div>
      <div class="expiry-badge">Expires in 5 minutes</div>
    </div>

    <p class="content-text" style="font-size: 13.5px; color: #475569;">
      This code expires in 5 minutes.
    </p>

    <p class="security-note">
      If you did not request this password reset, you can safely ignore this email.<br>
      <strong>Please do not share this verification code with anyone.</strong>
    </p>

    <p class="signature">
      Team AspirePath
    </p>
  </div>

  <div class="footer">
    &copy; AspirePath Career Platform. All rights reserved.<br>
    This is an automated system notification.
  </div>
</body>
</html>"""

        logger.info(f"[EMAIL SERVICE] Dispatching password reset OTP email to {normalized_email}")
        return await cls._dispatch_email(
            to_email=normalized_email,
            subject=subject,
            html_body=html_body,
        )

    @classmethod
    async def send_password_reset_email(
        cls,
        to_email: str,
        reset_token: str,
        recipient_name: str = "Student",
        reset_url: Optional[str] = None,
    ) -> bool:
        """
        Dispatches a secure password reset link to the user's email address.
        """
        normalized_email = to_email.strip().lower()
        if cls._development_dispatch():
            cls._dev_reset_token_store[normalized_email] = reset_token

        base_frontend = settings.FRONTEND_URL.rstrip("/")
        final_url = reset_url or f"{base_frontend}/reset-password?{urlencode({'token': reset_token, 'email': normalized_email})}"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F8FBFF; color: #0F172A; margin: 0; padding: 24px; }}
            .card {{ max-width: 500px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #DBEAFE; padding: 32px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.05); }}
            .brand {{ font-size: 20px; font-weight: 800; color: #3B82F6; margin-bottom: 20px; text-align: center; }}
            .title {{ font-size: 22px; font-weight: 700; color: #0F172A; text-align: center; margin-bottom: 8px; }}
            .subtitle {{ font-size: 14px; color: #64748B; text-align: center; margin-bottom: 24px; line-height: 1.5; }}
            .btn {{ display: block; text-align: center; background: #3B82F6; color: #FFFFFF; text-decoration: none; font-weight: 600; padding: 14px 24px; border-radius: 12px; margin: 24px 0; }}
            .link-text {{ word-break: break-all; font-size: 12px; color: #3B82F6; }}
            .warning {{ font-size: 12px; color: #94A3B8; text-align: center; margin-top: 20px; line-height: 1.4; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">CareerPlatform</div>
            <h1 class="title">Reset Your Password</h1>
            <p class="subtitle">Hello {recipient_name}, we received a request to reset the password for your CareerPlatform account.</p>
            <a href="{final_url}" class="btn">Reset Password</a>
            <p class="subtitle" style="font-size: 12px;">Or copy and paste this URL into your browser:</p>
            <p class="link-text">{final_url}</p>
            <p class="subtitle">This link is valid for <strong>15 minutes</strong> and can only be used once.</p>
            <p class="warning">If you did not request a password reset, no action is needed. Your account remains secure.</p>
          </div>
        </body>
        </html>
        """

        logger.info(f"[EMAIL SERVICE] Dispatching password reset link to {normalized_email}")
        if cls._development_dispatch():
            print(f"\n[EMAIL SERVICE DEV DISPATCH] Password Reset Link for {normalized_email}: {final_url}\n")

        # Provider dispatch
        return await cls._dispatch_email(
            to_email=normalized_email,
            subject="Reset Your Career Platform Password",
            html_body=html_body,
        )

    @classmethod
    async def send_project_moderation_email(
        cls,
        to_email: str,
        student_name: str,
        project_title: str,
        action: str,  # "approve", "reject", "request_changes"
        reviewer_notes: str = "",
    ) -> bool:
        """
        Dispatches project moderation decision and feedback comments to the student's email.
        """
        normalized_email = to_email.strip().lower()

        action_labels = {
            "approve": ("Approved & Published", "#10B981", "#ECFDF5"),
            "reject": ("Submission Rejected", "#EF4444", "#FEF2F2"),
            "request_changes": ("Revisions Requested", "#F59E0B", "#FFFBEB"),
        }
        label, color, bg_color = action_labels.get(
            action, ("Status Updated", "#3B82F6", "#EFF6FF")
        )

        subject = f"Project Submission Update: {project_title} [{label}]"
        base_frontend = settings.FRONTEND_URL.rstrip("/")

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F8FBFF; color: #0F172A; margin: 0; padding: 24px; }}
            .card {{ max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #DBEAFE; padding: 32px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.05); }}
            .brand {{ font-size: 20px; font-weight: 800; color: #3B82F6; margin-bottom: 20px; text-align: center; }}
            .title {{ font-size: 22px; font-weight: 700; color: #0F172A; text-align: center; margin-bottom: 8px; }}
            .subtitle {{ font-size: 14px; color: #64748B; text-align: center; margin-bottom: 20px; line-height: 1.5; }}
            .status-pill {{ display: inline-block; background: {bg_color}; color: {color}; font-weight: 700; font-size: 13px; padding: 6px 16px; border-radius: 9999px; border: 1px solid {color}33; }}
            .notes-box {{ background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid {color}; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: left; }}
            .notes-header {{ font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748B; margin-bottom: 6px; }}
            .notes-content {{ font-size: 14px; color: #1E293B; line-height: 1.6; }}
            .btn {{ display: block; text-align: center; background: #3B82F6; color: #FFFFFF; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 12px; margin: 24px 0 12px 0; }}
            .footer {{ font-size: 12px; color: #94A3B8; text-align: center; margin-top: 24px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">CareerPlatform Moderation</div>
            <div style="text-align: center; margin-bottom: 12px;">
              <span class="status-pill">{label}</span>
            </div>
            <h1 class="title">{project_title}</h1>
            <p class="subtitle">Hello {student_name}, your project submission has been reviewed by the platform moderation team.</p>
            
            <div class="notes-box">
              <div class="notes-header">Reviewer Feedback & Comments:</div>
              <div class="notes-content">{reviewer_notes or "No additional feedback notes provided."}</div>
            </div>

            <a href="{base_frontend}/my-projects" class="btn">View Your Projects Workspace</a>
            <p class="footer">If you have any questions about this review decision, reply directly to this notification or reach out through our support channel.</p>
          </div>
        </body>
        </html>
        """

        logger.info(
            f"[EMAIL SERVICE] Sent moderation feedback email to {normalized_email} for project '{project_title}' (decision: {action})"
        )
        if cls._development_dispatch():
            print(
                f"\n[EMAIL SERVICE DEV DISPATCH] Moderation Notification -> Recipient: {normalized_email} | Action: {action.upper()} | Project: '{project_title}' | Comments: '{reviewer_notes}'\n"
            )

        # Provider dispatch
        return await cls._dispatch_email(
            to_email=normalized_email,
            subject=subject,
            html_body=html_body,
        )

    @classmethod
    def record_dev_reset_token(cls, email: str, token: str) -> None:
        """Stores token in development in-memory registry for verification tests."""
        if cls._development_dispatch():
            cls._dev_reset_token_store[email.strip().lower()] = token

    @classmethod
    def get_last_dev_otp(cls, email: str) -> Optional[str]:
        """Helper to inspect the last OTP dispatched in testing."""
        return cls._dev_otp_store.get(email.strip().lower())

    @classmethod
    def get_last_dev_reset_token(cls, email: str) -> Optional[str]:
        """Helper to inspect the last reset token dispatched in testing."""
        return cls._dev_reset_token_store.get(email.strip().lower())

    @classmethod
    def clear_dev_otps(cls) -> None:
        """Clears the dev OTP and reset registries."""
        cls._dev_otp_store.clear()
        cls._dev_reset_token_store.clear()
