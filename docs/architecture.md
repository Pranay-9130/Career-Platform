# System Architecture Document — Student Career Platform

**Project:** Student Career Platform  
**Target Environment:** Production Ready / Scalable Cloud  
**Document Version:** 1.0.0  

---

## 1. High-Level System Architecture

The platform adopts a decoupled, client-server modern web architecture built with **React.js** on the frontend, **Python FastAPI** on the backend, and **PostgreSQL** as the primary relational database. Object storage is integrated for file artifacts (project ZIPs, images, generated resumes). AI processing is strictly handled through an isolated backend service layer communicating with the Google Gemini API.

```
                          ┌─────────────────────────────────────┐
                          │         Web Client (Browser)        │
                          │   React 18+ / Tailwind CSS / Router │
                          └──────────────────┬──────────────────┘
                                             │ HTTPS / REST (JSON)
                                             ▼
                          ┌─────────────────────────────────────┐
                          │       Reverse Proxy / Cloud CDN     │
                          │        (Vercel / Cloudflare)        │
                          └──────────────────┬──────────────────┘
                                             │
                                             ▼
                          ┌─────────────────────────────────────┐
                          │         FastAPI Backend Core        │
                          │  Middleware (CORS, RateLimit, Auth) │
                          │  API Routes (Auth, Projects, Jobs)  │
                          └──────────┬───────────────┬──────────┘
                                     │               │
                 ┌───────────────────┴───┐           └──────────────────┐
                 ▼                       ▼                              ▼
    ┌────────────────────────┐  ┌──────────────────┐       ┌──────────────────────┐
    │  PostgreSQL Database   │  │  Object Storage  │       │   Google Gemini API  │
    │  Relational Data Store │  │  (S3-Compatible) │       │   (Backend AI Proxy) │
    │  SQLAlchemy + Alembic  │  │  ZIPs & Images   │       │   Secure API Key     │
    └────────────────────────┘  └──────────────────┘       └──────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1. Framework & Core Technologies
- **Library:** React.js (Functional components, Hooks, Context API)
- **Styling:** Tailwind CSS with custom light-blue theme tokens and custom utility classes
- **Routing:** React Router v6+ with nested layouts and route protection guards
- **HTTP Client:** Axios instance with request/response interceptors for automatic JWT refresh and unified error formatting
- **Icons:** Lucide React icons
- **Form Management:** Controlled components with schema validation (Zod / custom validators)

### 2.2. Directory Structure Conventions
```text
frontend/src/
├── assets/           # Static images, SVGs, brand logos
├── components/       # Atomic and composite UI components
│   ├── common/       # Button, Input, Badge, Spinner, Alert, Dropdown, Table
│   ├── navbar/       # PublicNavbar, StudentNavbar, AdminNavbar
│   ├── footer/       # PublicFooter, DashboardFooter
│   ├── cards/        # ProjectCard, JobCard, TemplateCard, MetricCard
│   ├── forms/        # MultiStepProjectForm, LoginForm, RegisterForm, OTPForm
│   └── modals/       # ConfirmationModal, PreviewModal, ImageLightboxModal
├── layouts/          # Layout wrappers providing headers, sidebars, and containers
│   ├── PublicLayout/ # Marketing & public discovery layout
│   ├── StudentLayout/# Authenticated student dashboard & sidebar layout
│   └── AdminLayout/  # Elevated administrative management layout
├── pages/            # Page-level route views
├── routes/           # AppRoutes, ProtectedRoute, RoleGuard
├── services/         # API abstraction modules (apiClient, authService, projectService, etc.)
├── hooks/            # Custom hooks (useAuth, useDebounce, usePagination, useToast)
├── context/          # React context providers (AuthContext, ThemeContext, ToastContext)
├── utils/            # Pure helper utilities (dateFormatter, fileValidation, stringUtils)
├── constants/        # Application constants, navigation items, status dictionaries
├── types/            # TypeScript / JSDoc prop definitions
└── styles/           # Tailwind configuration, global CSS styles, typography
```

### 2.3. Routing & Route Guarding Architecture
- **Public Routes:** Accessible by unauthenticated visitors (`/`, `/about`, `/projects`, `/projects/:slug`, `/jobs`, `/jobs/:slug`, `/templates`, `/contact`).
- **Auth Routes:** Public authentication pages (`/login`, `/register`, `/forgot-password`, `/reset-password`).
- **Student Protected Routes:** Require valid authenticated session with role `STUDENT` or `ADMIN` (`/dashboard`, `/my-projects`, `/add-project`, `/resume-builder`, `/ats-analyzer`, `/applications`, `/profile`, `/settings`).
- **Admin Protected Routes:** Strict role requirement `ADMIN` (`/admin/dashboard`, `/admin/projects`, `/admin/jobs`, `/admin/students`, `/admin/reports`).

---

## 3. Backend Architecture

### 3.1. Framework & Principles
- **Framework:** Python FastAPI (Asynchronous, high-performance, OpenAPI-driven)
- **Architecture Pattern:** Clean Layered Architecture:
  1. **Router Layer (`api/routes`):** Handles HTTP request parsing, status codes, and response serialization.
  2. **Dependency Layer (`api/dependencies`):** Provides dependency injection for DB sessions, current authenticated user, and permission validators.
  3. **Service Layer (`services/`):** Encapsulates core business logic, workflow rules, AI orchestration, and email dispatching.
  4. **Repository Layer (`repositories/`):** Directly queries database models using SQLAlchemy, abstracting data persistence.
  5. **Core / Utility Layer (`core/`, `utils/`):** Configuration management, crypto/security utilities, database engine setup.

### 3.2. Backend Directory Structure
```text
backend/app/
├── api/
│   ├── routes/          # auth.py, users.py, projects.py, jobs.py, resumes.py, ats.py, admin.py
│   └── dependencies/    # get_db, get_current_user, require_role, rate_limiter
├── core/
│   ├── config.py        # Pydantic Settings reading .env with validation
│   ├── security.py      # Password hashing, JWT token creation, token verification
│   └── database.py      # SQLAlchemy async/sync engine, sessionmaker, declarative base
├── models/              # SQLAlchemy ORM models mapping database tables
├── schemas/             # Pydantic v2 schemas for request validation & response DTOs
├── services/            # AuthService, ProjectService, StorageService, EmailService, AIService
├── repositories/        # UserRepository, ProjectRepository, JobRepository, ResumeRepository
├── middleware/          # CORS, RequestLogging, SecurityHeaders, RateLimiting
├── utils/               # File sanitizers, zip validators, otp generator
└── main.py              # FastAPI application bootstrap, lifecycle events, router registration
```

---

## 4. Database Architecture

- **Engine:** PostgreSQL 15+
- **ORM:** SQLAlchemy (with async support using `asyncpg` or synchronous `psycopg2`)
- **Migration Engine:** Alembic for automated, reversible schema version control
- **Connection Management:** Connection pool configured with sensible timeouts (`pool_size=10`, `max_overflow=20`, `pool_recycle=1800`) to prevent connection leaks under burst loads.

---

## 5. Authentication & Authorization Flow

### 5.1. Authentication Pipeline

Email/password registration hashes the password, creates the student account,
and immediately issues an access token plus rotating HttpOnly refresh cookie.
Login validates the password and active-account state, but does not gate access
on optional email verification. Google Identity Services returns an ID token to
the React callback; FastAPI verifies its signature, issuer, expiry, and audience
with Google's official library before linking or creating an account.

### 5.2. Role-Based Access Control (RBAC)
- Fast API dependency `require_role(["ADMIN"])` intercepts protected endpoints and raises `403 Forbidden` if the subject user's role does not match.

---

## 6. Object Storage & File Security Architecture

- **Storage Provider:** S3-compatible cloud object store (AWS S3, Cloudflare R2, MinIO).
- **Public Assets:** Screenshots and profile avatars stored with public read access or served via Cloud CDN with content hashing.
- **Private Artifacts:** Project ZIP files and resume PDF outputs stored in non-public buckets. Downloads are authorized via time-limited presigned URLs (valid for 5–15 minutes).
- **Zero Execution Sandbox:** Uploaded code files are strictly treated as data archives. Under no circumstances are student scripts or executables evaluated, unzipped into server root, or executed on the application host.

---

## 7. AI (Gemini) Architecture

- **Strict Isolation:** The frontend has zero knowledge of Gemini API keys.
- **Proxy Service:** Client sends resume text and job description to `/api/ats/analyze`.
- **Sanitization & Prompt Injection Defense:** Input strings are size-capped (max 15,000 characters), stripped of executable tokens, and wrapped in strict system prompts demanding structured JSON responses matching Pydantic schemas.
- **Fallback & Resilience:** Circuit-breaker handling for API rate limits and structured fallback error reporting.

---

## 8. Development & Environment Strategy

| Environment | Purpose | Database | Storage |
| :--- | :--- | :--- | :--- |
| **Local Development** | Day-to-day feature development | Local PostgreSQL / SQLite fallback | Local filesystem storage |
| **Staging** | Pre-production testing, QA | Managed PostgreSQL instance | S3 Staging bucket |
| **Production** | Live student and recruiter traffic | High-availability Managed PostgreSQL | Production Cloudflare R2 / S3 |
