# Deployment & Production Blueprint — Student Career Platform

**Document Version:** 2.0.0  
**Target Environments:** Immediate Launch (Temporary URLs on Vercel & Render) ➔ Future Custom Domain  
**Backend Framework:** FastAPI (Python 3.11+) on Render  
**Frontend Framework:** React + Vite on Vercel  
**Database:** Managed PostgreSQL (Neon / Supabase / Render) with async SQLAlchemy & Alembic  
**Authentication:** JWT Bearer + Google Cloud OAuth2 + Email OTP  

---

## 1. Cloud Architecture Overview

### Phase 1: Immediate Launch (Free Tier Temporary Cloud URLs)
```
  [User Browser]
         │
         ├───► HTTPS ───► Frontend: https://<your-project>.vercel.app (Vercel Global CDN)
         │                       │
         │                       ▼ (VITE_API_BASE_URL)
         └───► HTTPS ───► Backend API: https://<your-service>.onrender.com (Render Web Service)
                                 │
                                 ├───► Managed PostgreSQL: Neon / Render / Supabase
                                 ├───► Google OAuth2: https://oauth2.googleapis.com
                                 ├───► Email Provider: SMTP / Resend / SendGrid
                                 └───► Gemini AI: Google AI Studio API
```

### Phase 2: Future Custom Domain Transition (No Code Changes Required)
```
                                  [Custom Domain: yourdomain.com]
                                                 │
                                                 ▼
                                     ┌──────────────────────┐
                                     │ Cloudflare DNS & SSL │
                                     └──────────┬───────────┘
                                                │
                         ┌──────────────────────┴──────────────────────┐
                         ▼                                             ▼
                 [app.yourdomain.com]                          [api.yourdomain.com]
             ┌─────────────────────────┐                   ┌─────────────────────────┐
             │    Frontend on Vercel   │                   │    Backend on Render    │
             └─────────────────────────┘                   └─────────────────────────┘
```
Switching to a custom domain in the future only requires adding custom domains in the Vercel & Render dashboards and updating 2 environment variables (`ALLOWED_ORIGINS` on Render, `VITE_API_BASE_URL` on Vercel).

---

## 2. Managed PostgreSQL Database Options & Limitations

| Hosting Provider | Free Tier Limits | Inactivity Behavior | Connection Limits & SSL | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Neon Serverless PostgreSQL** *(Recommended)* | 0.5 GB storage, 1 project | Compute auto-suspends after 5 min of inactivity; **wakes up in ~500ms** on first incoming request. | Up to 100 pooled connections via PgBouncer. SSL required (`sslmode=require` / `ssl=require`). | **Best for production demo & portfolio** — does not expire, stays free indefinitely. |
| **Supabase PostgreSQL** | 500 MB database, 1 GB storage | Project automatically pauses after **7 days of no queries**. Requires manual unpause in dashboard. | 60 direct / 200 pooled connections via Supavisor. SSL required. | Great option if you already use Supabase, but requires manual unpausing if inactive. |
| **Render Managed PostgreSQL** | 1 GB storage | **Strict 30-day expiration**: Free databases are **permanently deleted after 30 days** unless upgraded to paid Starter ($7/mo). | 97 connections. SSL required. | Convenient for quick tests, but **not recommended for lasting deployment** unless upgraded. |

### Connection String Formatting
Render and Neon provide standard PostgreSQL connection strings starting with `postgres://` or `postgresql://`. The platform backend automatically normalizes them in `app/core/config.py`:
- **Async endpoints (`DATABASE_URL`):** Converts to `postgresql+asyncpg://...` and applies `ssl=require`.
- **Alembic sync migrations (`SYNC_DATABASE_URL`):** Converts to `postgresql://...` with `sslmode=require`.

---

## 3. Step-by-Step Deployment Order

Deploy in this exact sequence to ensure all dependencies and cross-service URLs resolve smoothly without circular dependencies:

```
┌────────────────────────────────┐
│  Step 1: Provision PostgreSQL  │ ──► Get Connection String
└────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  Step 2: Deploy Backend Render │ ──► Get Render URL: https://<service>.onrender.com
└────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  Step 3: Deploy Frontend Vercel│ ──► Get Vercel URL: https://<project>.vercel.app
└────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  Step 4: Update Backend CORS   │ ──► Add Vercel URL to ALLOWED_ORIGINS & FRONTEND_URL
└────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  Step 5: Google Cloud & Email  │ ──► Add Vercel URL to Google OAuth origins; set Email keys
└────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  Step 6: Run Smoke Tests       │ ──► Verify registration, OTP, login, Google auth & DB
└────────────────────────────────┘
```

---

## 4. Backend Deployment Guide (Render)

### 4.1. Create Render Web Service
1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Fill in the service configuration:
   - **Name:** `careerplatform-api` (or preferred name)
   - **Region:** Choose closest to your audience (e.g., `Frankfurt` or `Oregon`)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt && alembic upgrade head
     ```
   - **Start Command:**
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
     ```
   - **Plan:** `Free`
   - **Health Check Path:** `/api/health` (or `/health`)

### 4.2. Render Environment Variables Matrix
Under the **Environment** tab of your Render service, configure the following:

| Environment Variable | Required | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Yes | `production` | Enables production mode |
| `DEBUG` | Yes | `false` | Disables interactive Swagger UI in production |
| `DATABASE_URL` | Yes | `postgresql+asyncpg://user:pass@host/db?ssl=require` | Async connection string from Neon/Render |
| `SYNC_DATABASE_URL` | Yes | `postgresql://user:pass@host/db?sslmode=require` | Sync connection string for Alembic |
| `JWT_SECRET` | Yes | *(Random 64-character hex string)* | Generate with `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | Yes | `https://<your-project>.vercel.app,http://localhost:5173` | Comma-separated list of allowed frontend origins |
| `FRONTEND_URL` | Yes | `https://<your-project>.vercel.app` | Base frontend URL for reset links and SEO tags |
| `EMAIL_PROVIDER` | Yes | `smtp` *(or resend, sendgrid, console)* | Active email provider |
| `EMAIL_FROM` | Yes | `noreply@yourdomain.com` *(or verified sender)* | Outbound email from address |
| `SMTP_HOST` | If SMTP | `smtp.gmail.com` *(or Brevo/SES/Mailgun)* | SMTP host server |
| `SMTP_PORT` | If SMTP | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | If SMTP | `your_email@gmail.com` | SMTP username |
| `SMTP_PASSWORD` | If SMTP | `your_16_char_app_password` | SMTP App Password (not your personal password) |
| `SMTP_USE_TLS` | If SMTP | `true` | STARTTLS toggle |
| `EMAIL_API_KEY` | If Resend | `re_xxxxxxxxxxxxxxxx` | API key if using Resend or SendGrid |
| `GOOGLE_CLIENT_ID` | Yes | `xxxx.apps.googleusercontent.com` | Client ID from Google Cloud Console |
| `GEMINI_API_KEY` | Optional | `AIzaSyxxxxxxxxxxxx` | Google Gemini API key for ATS resume scoring |

> [!NOTE]
> When initially creating the Render service, you can temporarily set `ALLOWED_ORIGINS=http://localhost:5173`. Once Vercel assigns your frontend URL in Step 5, update `ALLOWED_ORIGINS` and `FRONTEND_URL` with your actual Vercel temporary URL.

---

## 5. Frontend Deployment Guide (Vercel)

### 5.1. Create Vercel Project
1. Sign in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository.
4. In the project configuration screen:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click `Edit` and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 5.2. Vercel Environment Variables
Under the **Environment Variables** section, add:

| Environment Variable | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://careerplatform-api-xxxx.onrender.com/api` | The actual temporary Render URL from Step 4 |
| `VITE_GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Google Cloud Web Client ID |
| `VITE_APP_ENV` | `production` | Sets client environment to production |

### 5.3. SPA Routing & Asset Caching (`vercel.json`)
The repository includes `frontend/vercel.json` preconfigured with:
- Client-side SPA route rewrites (`/(.*)` ➔ `/index.html`) to prevent 404s when navigating directly to `/projects/:slug` or `/login`.
- 1-year immutable caching headers for hashed assets in `/assets/`.

---

## 6. Real Email OTP Delivery Configuration

The email service supports 4 selectable providers via `EMAIL_PROVIDER`:

### Option A: Gmail SMTP with App Password *(Easiest Free Option)*
1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Enable **2-Step Verification**.
3. Search for **App passwords** (or go to `myaccount.google.com/apppasswords`).
4. Create a new app password named `CareerPlatform`.
5. Copy the generated 16-character password.
6. Configure Render environment variables:
   ```env
   EMAIL_PROVIDER=smtp
   EMAIL_FROM=your_email@gmail.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   SMTP_USE_TLS=true
   SMTP_USE_SSL=false
   ```

### Option B: Resend REST API *(Recommended for Professional Transactional Email)*
1. Create a free account at [resend.com](https://resend.com) (free tier includes 3,000 emails/month).
2. Create an API Key under **API Keys**.
3. Configure Render environment variables:
   ```env
   EMAIL_PROVIDER=resend
   EMAIL_API_KEY=re_xxxxxxxxxxxxxxxx
   EMAIL_FROM=onboarding@resend.dev  # (or your verified domain address)
   ```

### Option C: SendGrid REST API
1. Create an API Key in [SendGrid Dashboard](https://app.sendgrid.com) with "Mail Send" permissions.
2. Configure Render environment variables:
   ```env
   EMAIL_PROVIDER=sendgrid
   EMAIL_API_KEY=SG.xxxxxxxxxxxxxxxx
   EMAIL_FROM=verified_sender@yourdomain.com
   ```

---

## 7. Google Cloud Sign-In Setup Guide

To enable "Sign in with Google" on your deployed application:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g., `CareerPlatform-Production`).
3. Navigate to **APIs & Services** ➔ **OAuth consent screen**:
   - User Type: **External**
   - App Name: `Student Career Platform`
   - User support email: Your email
   - Developer contact email: Your email
   - Scopes: Select `.../auth/userinfo.email` and `.../auth/userinfo.profile`
   - Publish status: Set to **In Production** (or add your test emails under Test Users while in Testing mode).
4. Navigate to **APIs & Services** ➔ **Credentials**:
   - Click **Create Credentials** ➔ **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `CareerPlatform Web Client`.
   - **Authorized JavaScript origins:**
     - `http://localhost:5173` (for local development)
     - `https://<your-project>.vercel.app` (your actual temporary Vercel URL)
   - Click **Create** and copy your **Client ID** (`xxxx.apps.googleusercontent.com`).
5. Save this Client ID in:
   - Backend on Render: `GOOGLE_CLIENT_ID`
   - Frontend on Vercel: `VITE_GOOGLE_CLIENT_ID`

---

## 8. Post-Deployment Verification & Smoke Test Matrix

After completing the steps above, run through this verification checklist against your live temporary URLs:

| Test Case | Method | Expected Result |
| :--- | :--- | :--- |
| **Health Check** | `GET https://<render-url>/api/health` | Returns HTTP 200 `{"status": "healthy", ...}` |
| **Root Status** | `GET https://<render-url>/health` | Returns HTTP 200 `{"status": "healthy", ...}` |
| **Frontend Load** | Open `https://<vercel-url>` in browser | Landing page loads with responsive styles and no console errors |
| **CORS Handshake** | Inspect Network tab on homepage API calls | HTTP 200 with `access-control-allow-origin: https://<vercel-url>` |
| **Registration & OTP** | Register new account on `https://<vercel-url>/register` | 6-digit OTP email arrives in inbox within 15 seconds; verification succeeds |
| **Google Sign-In** | Click "Continue with Google" on `/login` | Google OAuth modal appears, user completes auth, and is redirected to `/dashboard` |
| **Demo Login** | Click "Student Demo" button on `/login` | Signs in immediately as Alex Student (`student@university.edu`) |
| **Admin Clearance** | Click "Admin Demo" button on `/login` | Signs in as Morgan Admin (`admin@careerplatform.com`) and loads admin stats |
| **Database Persistence** | Submit a project or bookmark an item | Reload page; persisted data is retrieved from PostgreSQL database |
| **Deep Link Routing** | Directly load `https://<vercel-url>/projects/ai-resume-matcher` | Page renders cleanly without 404 |

---

## 9. Future Custom Domain Switchover Guide

When you purchase a custom domain (e.g., `careerplatform.com`):

1. **Vercel Frontend Domain:**
   - In Vercel Project Settings ➔ **Domains**, add `www.careerplatform.com` and `careerplatform.com` (or `app.careerplatform.com`).
   - Add the suggested CNAME and A records in your domain registrar's DNS panel.
2. **Render Backend Domain:**
   - In Render Web Service Settings ➔ **Custom Domains**, add `api.careerplatform.com`.
   - Add the suggested CNAME record in your domain registrar's DNS panel pointing to `careerplatform-api.onrender.com`.
3. **Update Environment Variables:**
   - On Render: Set `ALLOWED_ORIGINS=https://www.careerplatform.com,https://careerplatform.com` and `FRONTEND_URL=https://www.careerplatform.com`.
   - On Vercel: Set `VITE_API_BASE_URL=https://api.careerplatform.com/api`.
   - In Google Cloud Console: Add `https://www.careerplatform.com` to **Authorized JavaScript origins**.
4. Redeploy services — **Zero code changes required!**
