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
4. Set `GEMINI_API_KEY` if using the AI integration. It stays on the server.
5. Deploy. The image builds the frontend, installs the backend, and applies migrations
   at startup before accepting traffic. `/api/health/ready` checks database access
   and the new session/upload tables.
6. For a custom frontend domain, explicitly set `FRONTEND_URL` and
   `ALLOWED_ORIGINS` to that domain.
7. Sign in at `/login` using your privately provisioned administrator credentials.
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

### Transactional email

- Render free services block SMTP ports 25, 465, and 587. Password reset and other
  transactional messages still need email. In Render's environment
  settings use `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY` from Resend, and
  `EMAIL_FROM` with a sender on a domain verified in that same Resend account.
  A Gmail address is not a verified Resend sender domain; `resend.dev` testing
  addresses cannot deliver messages to arbitrary students. Registration itself
  does not send email or depend on email-provider availability.
- After redeploying, retry registration and inspect Render logs. HTTP 401 points
  to the key, 403 to permissions/sender verification/testing restrictions, and
  429 to quota/rate limits. Provider dashboard logs give the specific reason.
  The application deliberately does not log raw provider responses or OTPs.
- Set `FRONTEND_URL` to the real public frontend URL, not an example placeholder,
  if it is explicitly configured. With the single-service deployment, remove
  a stale explicit value to use Render's `RENDER_EXTERNAL_URL` automatically.

For the currently deployed separate services, use the frontend and API URLs:

```sh
py scripts/check_deployment.py --frontend https://careerplatform.onrender.com --backend https://careerplatform-api.onrender.com
```

Verify email/password sign-in, immediate registration, password recovery, logout, and a ZIP
download after restart in the actual browser. Those external checks require a
running deployment and your Google/email provider settings.

For a separately hosted frontend, the optional Vercel proxy setup remains documented
in [release-checks.md](release-checks.md).
