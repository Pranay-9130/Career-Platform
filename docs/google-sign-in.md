# Google Sign-In configuration

## Implemented flow

The React client uses Google Identity Services (`accounts.google.com/gsi/client`)
in JavaScript callback mode. It fetches the public Web application client ID from
`GET /api/auth/config`, renders Google's button, receives an ID-token credential,
and posts it to `POST /api/auth/google`. The FastAPI backend validates the token
with Google's official Python authentication library using `GOOGLE_CLIENT_ID` as
the expected audience. It does not accept or expose a Google client secret.

The backend stores Google's stable `sub` identifier for repeat sign-in. A first
sign-in may link an existing password account by verified email only when Google
is authoritative for that Gmail or Workspace address. Administrators and
third-party-email Google accounts are not automatically linked.

## Current deployed URLs

- Frontend origin: `https://careerplatform.onrender.com`
- Backend origin: `https://careerplatform-api.onrender.com`

## Environment variables

- Backend/local `backend/.env`: `GOOGLE_CLIENT_ID=<web-client-id>.apps.googleusercontent.com`
- Render: set the same `GOOGLE_CLIENT_ID` in the service Environment page.
- Backend: `ALLOWED_ORIGINS` must contain every separately hosted frontend origin.
- Current separately hosted frontend: `VITE_API_BASE_URL=https://careerplatform-api.onrender.com/api`.
- `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are not used.

Confirm the ID actually served to a deployment with:

```sh
curl https://careerplatform-api.onrender.com/api/auth/config
```

The returned `google_client_id` must exactly match the Web application client
edited in Google Cloud Console.

## Google Cloud Console

Open Google Auth Platform -> Clients (or APIs & Services -> Credentials), select
that exact OAuth 2.0 **Web application** client, and add these under **Authorized
JavaScript origins**:

- `http://localhost:5173`
- `http://127.0.0.1:5173` if that address is used locally
- `https://careerplatform.onrender.com` for the current production frontend
- `https://YOUR-PROJECT.vercel.app` only if a Vercel frontend is also deployed
- Each real custom frontend origin, such as `https://careerplatform.com`

Origins must contain only scheme, host, and a non-default port when applicable:
no path, `/login`, wildcard, query, fragment, or trailing slash. Do not add
`https://careerplatform-api.onrender.com` as a JavaScript origin because users do
not load the frontend from that host.

**Authorized redirect URIs:** none. Remove the existing
`https://careerplatform-api.onrender.com/` entry. This implementation uses a
JavaScript callback, not Google's redirect/callback flow. `/api/auth/google` is
the app's token-verification endpoint and must not be entered as a Google
redirect URI.

If the OAuth consent screen is in Testing, add intended accounts as test users or
publish the app as appropriate. An `origin_mismatch` error is resolved in Google
Cloud Console; changing CORS alone cannot resolve it.
