# Day 08 — Email OTP

**Phase:** Email OTP  
**Status:** [x] Completed  
**Target Completion:** Day 08 of 40  

---

## 1. Objective
Implement 6-digit email OTP verification for registration and secure login challenges, with cryptographically secure generation, attempt capping, resend rate-limiting, and an auto-advancing verification UI.

---

## 2. Key Features Implemented

### Backend Architecture
- **OTP Persistence Model (`backend/app/models/otp.py`):**
  - `OTPVerification` model extending `BaseUUIDModel` with `user_id`, `email`, `otp_hash`, `purpose`, `attempt_count`, `max_attempts` (5), `expires_at` (5 minutes), and `invalidated_at`.
- **Crypto & Security Utilities (`backend/app/utils/otp.py`):**
  - `generate_secure_otp(6)`: Cryptographically secure 6-digit number generated using `secrets.randbelow`.
  - `hash_otp(otp)`: HMAC-SHA256 digestion using platform secret; raw plaintext codes are never stored in the database.
  - `verify_otp_hash(plain_otp, stored_hash)`: Constant-time comparison via `hmac.compare_digest` preventing timing side-channel attacks.
- **Transactional Email Service (`backend/app/services/email_service.py`):**
  - `EmailService.send_otp_email`: Formats responsive HTML email with light-blue branding, bold letter-spaced OTP display, and 5-minute expiry warning.
  - Supports dev mode in-memory capture and SendGrid / SMTP integration hooks.
- **API Endpoints (`backend/app/api/routes/auth.py`):**
  - `POST /api/auth/register`: Dispatches initial verification OTP upon account creation.
  - `POST /api/auth/send-otp` & `POST /api/auth/resend-otp`: Enforces 60-second cooldown (`429 Too Many Requests` if within cooldown), invalidates previous unverified OTPs, and dispatches a fresh code.
  - `POST /api/auth/verify-otp`: Validates 6-digit code against HMAC hash, caps attempts at 5 (locking on the 5th failed try), verifies expiration, and activates user (`is_verified = True`) with a refreshed JWT token.

### Frontend Architecture
- **Auto-Advancing Input Component (`frontend/src/components/auth/OTPInput.jsx`):**
  - 6 individual digit input boxes with clean light-blue focus borders.
  - Auto-advances focus on digit input.
  - Backspace navigation (deletes and auto-focuses previous box).
  - Arrow key navigation (Left/Right).
  - Full clipboard paste support (distributes 6 digits across inputs and auto-completes).
- **Verification Page (`frontend/src/pages/auth/VerifyOtpPage.jsx`):**
  - Displays masked recipient email (`a***n@university.edu`).
  - Real-time 5-minute expiration countdown timer.
  - Resend button with active 60-second cooldown timer.
  - Descriptive inline alerts for invalid codes, remaining attempts, and lockout warnings.
  - Seamless redirection to student workspace upon verification.
- **Onboarding Pipeline Wiring:**
  - `RegisterPage.jsx` now smoothly routes newly registered students to `/verify-otp` with recipient state.
  - `authService.js` updated with `verifyOtp` and `resendOtp` client methods.

---

## 3. Work Breakdown

### Files Created / Modified
- **Backend:**
  - `backend/app/models/otp.py`
  - `backend/app/models/__init__.py`
  - `backend/app/utils/otp.py`
  - `backend/app/services/email_service.py`
  - `backend/app/schemas/otp.py`
  - `backend/app/schemas/__init__.py`
  - `backend/app/api/routes/auth.py`
  - `backend/tests/unit/test_otp.py`
- **Frontend:**
  - `frontend/src/components/auth/OTPInput.jsx`
  - `frontend/src/components/auth/index.js`
  - `frontend/src/pages/auth/VerifyOtpPage.jsx`
  - `frontend/src/pages/auth/RegisterPage.jsx`
  - `frontend/src/services/authService.js`
- **Documentation:**
  - `progress/day-08.md`
  - `progress/development-roadmap.md`

---

## 4. Testing & Verification Plan

- **Backend Automated Tests (`pytest`):**
  - `tests/unit/test_otp.py`:
    - `test_registration_generates_and_dispatches_otp`: Verified OTP generation and email dispatch.
    - `test_verify_otp_success_activates_account`: Verified successful code submission sets `is_verified=True`.
    - `test_verify_otp_invalid_code_decrements_attempts`: Verified failure response indicates remaining attempts.
    - `test_verify_otp_fifth_failed_attempt_locks`: Verified lockout and invalidation on 5th failure.
    - `test_verify_otp_expired_code_rejected`: Verified rejection of expired OTPs.
    - `test_resend_otp_cooldown_enforced`: Verified HTTP 429 when resending within 60s cooldown.
    - `test_resend_otp_after_cooldown_succeeds`: Verified successful new code generation after cooldown.
  - **Full Backend Suite:** 31 passed in 5.98s (0 failures, 0 regressions).
- **Frontend Production Build:**
  - Executed `npm run build`: 1692 modules transformed, 0 errors, generated clean production bundle.

---

## 5. Acceptance Criteria
- [x] OTP verification securely activates user account; OTP is never logged or exposed in client payloads.
- [x] Attempt limit capping (max 5) and 60-second cooldown rate-limiting enforced.
- [x] Auto-advancing 6-digit input UI with clipboard paste support works seamlessly.
- [x] Code passes all linting, type checks, and automated tests.
- [x] No regression in existing functionality.

---

## 6. Daily Progress Notes
- Work Completed: Day 08 Email OTP architecture fully implemented across backend and frontend.
- Next Phase: **Day 09 — Password Reset** (Secure token generation, reset email flow, expiration, new password form).
