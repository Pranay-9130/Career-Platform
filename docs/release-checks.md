# Release setup and checks

The default deployment is now the single-domain Docker service described in
[deploy-now.md](deploy-now.md). The Vercel instructions below are optional for
users who specifically want a separately hosted frontend.

## Backend

1. Set `ENVIRONMENT=production`, `DEBUG=false`, and a unique `JWT_SECRET`.
2. Set `DATABASE_URL` to the production PostgreSQL URL. `SYNC_DATABASE_URL` is
   derived automatically when absent; an explicit value must point to the same database.
3. Run `alembic upgrade head` before starting the backend. Render's build does this.
4. New project ZIPs live in PostgreSQL. Before losing access to an old host's disk,
   run `py scripts/migrate_archives.py` there. It retains originals and reports missing files.
   Database backups and storage quotas now include archive bytes (up to 50 MB each).
5. Configure SMTP or Resend/SendGrid with a verified sender. Console delivery and
   credential-less fallback are disabled in production. Test a real inbox.
6. Set `FRONTEND_URL` and `ALLOWED_ORIGINS` to the actual HTTPS frontend origin.
7. On a new database provision the administrator with `py scripts/provision_admin.py`.
   Credentials provisioned into one database do not automatically transfer to another.
8. Existing refresh JWTs issued before database sessions were added cannot renew.
   Rotate `JWT_SECRET` once during this upgrade if immediate revocation of all
   pre-upgrade access JWTs is required; otherwise they expire normally.

## Frontend

Before deploying from `frontend`, run:

```sh
npm run configure:deployment -- https://YOUR-BACKEND.onrender.com
```

This puts `/api/:path*` ahead of the SPA fallback in `vercel.json` and proxies to
the backend. Configure `VITE_API_BASE_URL=/api` on Vercel. The browser now calls
the frontend origin for API requests, so refresh cookies do not depend on third-party
cookie support. Do not point that variable directly to a separate Render domain.

The frontend login and registration screens use email and password authentication.

## Live verification

Run the read-only check from `backend`:

```sh
py scripts/check_deployment.py --frontend https://aspirepath.vercel.app --backend https://careerplatform-api.onrender.com
```

Then in a browser on the real frontend:

1. Register a student; confirm the dashboard opens immediately and no verification email is sent.
2. Sign in with email and password; confirm the existing user record is reused.
3. Verify the refresh cookie is HttpOnly/Secure, and API traffic stays under the frontend's `/api`.
4. Reload a protected page and wait for access-token expiry; the session should renew.
5. Sign out; both the saved access credential and refresh credential should be rejected.
6. Reset a password; sessions on other devices should no longer work.
7. Upload/download a project ZIP, restart the backend, then download the same bytes again.
8. Verify a student cannot register as admin or access `/admin`.

Automated tests cannot replace the real Google consent flow or prove password-reset inbox delivery.
