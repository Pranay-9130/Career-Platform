# Day 06 — Authentication Architecture

**Phase:** Authentication Architecture  
**Status:** [x] Completed  
**Target Completion:** Day 06 of 40  

---

## 1. Objective
Implement foundational authentication and role-based access control (RBAC) infrastructure across backend and frontend, including password security, JWT issuance and verification, authorization dependencies, reactive client state, and client-side route guards.

---

## 2. Key Features Implemented

### Backend Architecture
- **User Models & Enumerations:**
  - `UserRole` enum (`STUDENT`, `ADMIN`).
  - `User` model (`backend/app/models/user.py`) extending `BaseUUIDModel` with `email`, `hashed_password`, `full_name`, `role`, `is_active`, `is_verified`, `headline`, and `avatar_url`.
- **JWT & Password Security:**
  - Configured CryptContext using `bcrypt` in `backend/app/core/security.py` with `verify_password` and `get_password_hash`.
  - Configured JWT encoder/decoder with signed claims (`sub`, `role`, `exp`, `iat`) and safe validation in `create_access_token` and `decode_token`.
- **Auth Dependency Chain:**
  - `oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)`.
  - `get_token_payload`: Validates bearer token presence and signature; returns 401 Unauthorized with `WWW-Authenticate: Bearer` on missing/expired/invalid token.
  - `get_current_user`: Resolves authenticated user record from database by UUID subject.
  - `get_current_active_user`: Verifies account `is_active` state; raises HTTP 400 if deactivated.
  - `require_role(required_role)`: Enforces role authorization (with ADMIN role granted superuser clearance); raises HTTP 403 Forbidden with clear diagnostic message when privileges are insufficient.
  - `require_roles(allowed_roles)`: Multi-role authorization guard.
- **Verification Routes:**
  - `GET /api/auth/me`: Returns `UserRead` for authenticated token.
  - `GET /api/auth/student-only`: Demonstrates student clearance.
  - `GET /api/auth/admin-only`: Demonstrates strict admin clearance.

### Frontend Architecture
- **Client Persistence & API Client:**
  - `frontend/src/services/authService.js`: Encapsulates access token (`career_platform_token`) and user metadata (`career_platform_user`) in `localStorage` with fail-safe error handling.
  - `frontend/src/services/api.js`: Axios instance with request interceptor automatically injecting `Authorization: Bearer <token>` and response interceptor catching `401 Unauthorized` to flush expired state and dispatch `auth:unauthorized` window event.
- **Reactive Auth State:**
  - `frontend/src/context/AuthContext.jsx`: `AuthProvider` context managing `user`, `token`, `isAuthenticated`, `isLoading`, `isAdmin`, `isStudent`, `login`, `logout`, `updateUser`, and `hasRole`.
  - `frontend/src/hooks/useAuth.js`: Custom hook providing clean access to auth state.
- **Route Guards:**
  - `frontend/src/components/auth/ProtectedRoute.jsx`: Verifies session authentication with loading spinner state, redirects unauthenticated requests to `/login` with previous location saved in history state, and verifies `allowedRoles`.
  - `frontend/src/components/auth/RoleGuard.jsx`: Enforces strict administrative role permissions with custom fallback redirects or access restricted alert UI.
- **Master Routing Integration:**
  - Wrapped `frontend/src/App.jsx` in `<AuthProvider>`.
  - Protected student workspace routes (`/dashboard`, `/my-projects`, `/resume-builder`, `/ats-analyzer`, `/applications`, `/saved`, `/profile`, `/settings`) with `ProtectedRoute`.
  - Protected admin workspace routes (`/admin/*`) with `RoleGuard`.

---

## 3. Work Breakdown

### Files Created / Modified
- **Backend:**
  - `backend/app/models/user.py`
  - `backend/app/models/__init__.py`
  - `backend/app/schemas/token.py`
  - `backend/app/schemas/user.py`
  - `backend/app/schemas/__init__.py`
  - `backend/app/api/dependencies/auth.py`
  - `backend/app/api/dependencies/__init__.py`
  - `backend/app/api/routes/auth.py`
  - `backend/app/api/routes/__init__.py`
  - `backend/tests/unit/test_security.py`
  - `backend/tests/unit/test_auth_deps.py`
- **Frontend:**
  - `frontend/src/services/authService.js`
  - `frontend/src/services/api.js`
  - `frontend/src/context/AuthContext.jsx`
  - `frontend/src/hooks/useAuth.js`
  - `frontend/src/components/auth/ProtectedRoute.jsx`
  - `frontend/src/components/auth/RoleGuard.jsx`
  - `frontend/src/components/auth/index.js`
  - `frontend/src/App.jsx`
- **Documentation:**
  - `progress/day-06.md`
  - `progress/development-roadmap.md`

---

## 4. Testing & Verification Plan

- **Backend Unit & Integration Tests:**
  - Executed `pytest` across all suites: **14 passed in 2.74s**.
  - `test_password_hashing_and_verification`: Verified Bcrypt hashing and validation.
  - `test_create_and_decode_valid_access_token`: Verified token creation, exp claim, and claims decoding.
  - `test_decode_expired_token`: Verified expired tokens decode to `None`.
  - `test_decode_invalid_tampered_token`: Verified tampered signatures return `None`.
  - `test_unauthenticated_request_rejected`: Verified HTTP 401 with `WWW-Authenticate: Bearer`.
  - `test_student_can_access_student_route`: Verified HTTP 200 for student role.
  - `test_student_forbidden_from_admin_route`: Verified HTTP 403 Forbidden with descriptive detail.
  - `test_admin_can_access_admin_route`: Verified HTTP 200 for admin role.
  - `test_admin_can_access_student_route`: Verified HTTP 200 for admin role on student routes.
- **Frontend Production Build:**
  - Executed `npm run build`:
  - `1690 modules transformed`, 0 errors, generated clean production bundle.

---

## 5. Acceptance Criteria
- [x] Secure token generation and decoding works with expiration validation.
- [x] Unauthorized requests to protected endpoints return 401 and role violations return 403.
- [x] Frontend `AuthContext` provides centralized login/logout lifecycle and token injection into API requests.
- [x] Protected routes redirect unauthenticated users to `/login`.
- [x] Code passes all linting, type checks, and regression tests.

---

## 6. Daily Progress Notes
- Work Completed: Day 06 Authentication Architecture fully executed.
- Next Phase: **Day 07 — Registration + Login** (Interactive credential forms, client validation, auth store integration, backend user registration and token dispatch).
