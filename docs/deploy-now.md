# Deploy the website

The default `render.yaml` now deploys one Docker service containing the React
website and FastAPI API. Both are served on the same HTTPS origin, so no separate
Vercel site, custom domain, or cross-site cookie workaround is required.

## Render

1. Push this repository and create a Render Blueprint using `render.yaml`.
2. Supply `DATABASE_URL` using the same PostgreSQL database currently holding your
   registered students and administrator. Do not create a different empty database
   unless you intend to start over. Secrets belong in Render environment settings.
3. Set `EMAIL_API_KEY` to your Resend key and `EMAIL_FROM` to your verified sender.
   The blueprint uses HTTPS email delivery; another HTTPS provider can be configured.
4. Set `GOOGLE_CLIENT_ID` to your Google web client ID. It is read at runtime by both
   the API and the website, avoiding mismatched frontend/backend client IDs.
5. Set `GEMINI_API_KEY` if using the AI integration. It stays on the server.
6. Deploy. The image builds the frontend, installs the backend, and applies migrations
   at startup before accepting traffic. `/api/health/ready` checks database access
   and the new session/upload tables.
7. Add the service's assigned HTTPS URL to Google Cloud's Authorized JavaScript
   Origins. Render's `RENDER_EXTERNAL_URL` automatically supplies the frontend URL
   and cookie origin allowlist. For a custom domain, explicitly set `FRONTEND_URL`
   and `ALLOWED_ORIGINS` to that domain.
8. Sign in at `/login` using your privately provisioned administrator credentials.
   The existing PostgreSQL administrator is retained; no demo accounts are created.

The current blueprint retains the free service plan for initial deployment.
Select hosting capacity appropriate to your usage; database archive bytes count
toward your PostgreSQL quota. The app does not depend on the host's ephemeral disk.

## Docker elsewhere

From the repository root:

```sh
docker build -t career-platform .
docker run --env-file backend/.env -e FRONTEND_DIST_DIR=/app/frontend-dist -p 8000:8000 career-platform
```

The environment file stays outside the image. For HTTPS production configure
`ENVIRONMENT=production`, `DEBUG=false`, the public `FRONTEND_URL` and
`ALLOWED_ORIGINS`, and a unique `JWT_SECRET`. The container serves the website
and API on port 8000 (or the supplied `PORT`). No Node process runs in production.

## Final verification

Use `backend/scripts/check_deployment.py` with the same URL for frontend and backend:

```sh
py scripts/check_deployment.py --frontend https://YOUR-SERVICE.onrender.com --backend https://YOUR-SERVICE.onrender.com
```

Verify Google sign-in, OTP inbox delivery, password recovery, logout, and a ZIP
download after restart in the actual browser. Those external checks require a
running deployment and your Google/email provider settings.

For a separately hosted frontend, the optional Vercel proxy setup remains documented
in [release-checks.md](release-checks.md).
