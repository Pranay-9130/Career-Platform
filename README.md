# Student Career Platform

> **“From your first project to your first job.”**

A production-grade, unified career development web platform engineered to help students move seamlessly through:

$$\textbf{DISCOVER} \longrightarrow \textbf{BUILD} \longrightarrow \textbf{SHOWCASE} \longrightarrow \textbf{PREPARE} \longrightarrow \textbf{APPLY} \longrightarrow \textbf{GET HIRED}$$

---

## 1. Mission & Vision

### Mission
To help every student discover their potential, build practical skills, showcase their work, and access better career opportunities.

### Vision
To become a trusted career development platform for students worldwide, making career preparation and opportunities accessible to every student regardless of institutional background.

---

## 2. Core Modules & Features

- **Project Discovery & Detail:** Curated project ideas categorized by domain, difficulty, and technology with comprehensive guides, prerequisites, and resource links.
- **Student Project Showcase:** Multi-step submission system allowing students to upload project details, screenshots, and ZIP archives without requiring GitHub knowledge.
- **Secure ZIP Ingestion:** Untrusted upload validation (magic bytes, 50MB ceiling, zip bomb defense, zero server execution).
- **Resume Builder & ATS Templates:** Two-pane split-screen builder with ATS-friendly templates and live updating preview.
- **ATS Analyzer (AI-Powered):** Compares student resumes against job descriptions using Google Gemini API on the backend with skill match breakdowns and actionable suggestions.
- **Jobs & Internships Catalog:** Curated entry-level jobs and internships with rich filtering by domain, stipend, and remote/hybrid work modes.
- **Application Tracker:** Kanban-style pipeline tracking application stages (`Saved` $\rightarrow$ `Applied` $\rightarrow$ `Interview` $\rightarrow$ `Selected`).
- **Student Profile & Public Portfolio:** Public portfolio showcase at `/u/:username` displaying verified, approved projects.
- **Email OTP Authentication:** Secure 6-digit OTP verification with 5-minute expiry, hashing, attempt limits, and rate-limiting.
- **Admin Moderation Console:** Review queue for inspecting submissions, approving, requesting changes, or rejecting with feedback notes.

---

## 3. Technology Stack

### Frontend
- **Framework:** React.js 18+ (Functional Components, Hooks, Context API)
- **Styling:** Tailwind CSS with custom **Light Blue** palette (`#3B82F6`, `#60A5FA`, `#EFF6FF`, `#F8FBFF`, `#06B6D4`)
- **Routing:** React Router v6+ with nested layouts and route guards
- **Icons:** Lucide React icons
- **HTTP Client:** Axios with centralized interceptors

### Backend
- **Framework:** Python 3.11+ / FastAPI
- **Architecture:** Layered Architecture (`routes` $\rightarrow$ `dependencies` $\rightarrow$ `services` $\rightarrow$ `repositories` $\rightarrow$ `models`)
- **API Spec:** OpenAPI / Swagger standard compliant
- **Validation:** Pydantic v2 schemas

### Database
- **Engine:** PostgreSQL 15+
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic

### Artificial Intelligence
- **Engine:** Google Gemini API (Strictly isolated on backend, zero client credential exposure)

### Storage & Infrastructure
- **Object Storage:** S3-compatible cloud storage (Cloudflare R2, AWS S3)
- **Hosting Target:** Vercel (Frontend), Render / Docker (Backend), Managed PostgreSQL

---

## 4. Repository Structure

```text
├── frontend/                 # React frontend application
│   ├── public/               # Public assets and favicon
│   └── src/                  # Source code
│       ├── assets/           # Static graphics & brand elements
│       ├── components/       # Common, navbar, footer, cards, forms, modals
│       ├── layouts/          # PublicLayout, StudentLayout, AdminLayout
│       ├── pages/            # Public, auth, student, and admin views
│       ├── routes/           # Router configuration & route guards
│       ├── services/         # Axios API service clients
│       ├── hooks/            # Custom React hooks
│       ├── context/          # React contexts (Auth, Toast, etc.)
│       ├── utils/            # Formatting and helper utilities
│       ├── constants/        # App constants and status maps
│       ├── types/            # Type definitions
│       └── styles/           # Tailwind configuration & global CSS
│
├── backend/                  # FastAPI backend application
│   ├── app/
│   │   ├── api/              # API routes & dependency injection
│   │   ├── core/             # Config, security, database engine
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Business logic & AI/Email services
│   │   ├── repositories/     # Data access layer
│   │   ├── middleware/       # CORS, rate limiting, request logging
│   │   ├── utils/            # ZIP validators, file sanitizers, OTP crypto
│   │   └── main.py           # Application entrypoint
│   ├── tests/                # Unit, integration, and security test suites
│   ├── migrations/           # Alembic database migrations
│   └── requirements.txt      # Python dependencies
│
├── docs/                     # Comprehensive architectural documentation
│   ├── product-requirements.md
│   ├── architecture.md
│   ├── design-system.md
│   ├── database-design.md
│   ├── api-documentation.md
│   ├── security.md
│   └── deployment.md
│
├── progress/                 # 40-Day progress tracking
│   ├── development-roadmap.md
│   ├── day-01.md ... day-40.md
│
├── .env.example              # Sample environment variables
├── .gitignore                # Git ignore configuration
└── README.md                 # Project README
```

---

## 5. Local Setup & Getting Started

For production deployment, follow [deploy-now.md](docs/deploy-now.md).
The default Render blueprint packages the website and API on one domain, with
database migrations, persistent ZIP storage, and revocable authentication sessions.

### Prerequisites
- Node.js 18+ and npm 9+
- Python 3.11+
- PostgreSQL 15+ (or local database instance)

### 1. Clone the repository
```bash
git clone <repo-url>
cd HIRING
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root (or frontend/backend respective directories):
```bash
cp .env.example .env
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Unix:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API interactive documentation will be available at `http://localhost:8000/docs`.

For local email verification without an external provider, set
`EMAIL_PROVIDER=console` in `backend/.env`. OTPs and password-reset links will be
printed by the backend process.

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will be available at `http://localhost:5173`.

### Authentication workflow

Public registration creates students only. Demo login accounts are not seeded.
Provision an administrator from `backend` with `py scripts/provision_admin.py`.
The script prompts for a password and stores its hash in the configured database.
`ADMIN_USERNAME` and `ADMIN_EMAIL` configure the administrator login alias and
internal email identity. Keep administrator passwords out of source control.

1. Register with email and password; the app sends a six-digit registration OTP.
2. Verify the OTP to mark the account verified and continue to the dashboard.
3. Later sign-ins issue a short-lived bearer token and a rotating HttpOnly refresh cookie.
4. The client validates restored sessions on startup and automatically refreshes an expired access token once.
5. Signing out clears both browser storage and the refresh cookie.

Google sign-in requires the same client ID in `backend/.env` (`GOOGLE_CLIENT_ID`)
and `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`). The frontend and backend public
origins must also be listed in Google Cloud and `ALLOWED_ORIGINS` respectively.

---

## 6. Environment Variables

Reference `.env.example` for the complete list of configuration parameters:
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: High-entropy key for signing access tokens.
- `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`: Transactional email service credentials.
- `GEMINI_API_KEY`: Google Gemini API key (strictly backend).
- `STORAGE_PROVIDER`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`: Object storage configuration.

---

## 7. Security Highlights

- **Zero Client Credential Exposure:** AI keys and cloud storage secrets reside strictly on backend.
- **Untrusted ZIP Sandbox:** Uploaded student code archives are treated as hostile, inspected for magic headers (`PK\x03\x04`), size-checked, and never executed on application hosts.
- **OTP Protection:** 6-digit verification codes expire in 5 minutes, hash-stored, limited to 5 attempts, with rate-limiting and 60-second cooldowns.
- **OWASP Compliance:** SQL injection prevention via SQLAlchemy ORM, XSS sanitization, and strict CORS whitelisting.

---

## 8. Development Roadmap

Development follows a structured **40-Day Development Plan** documented in detail in [`progress/development-roadmap.md`](file:///c:/Users/PRANAY/Desktop/HIRING/progress/development-roadmap.md). Each development day is executed sequentially with strict acceptance criteria and regression verification.

---

## 9. License

Proprietary — All rights reserved.
