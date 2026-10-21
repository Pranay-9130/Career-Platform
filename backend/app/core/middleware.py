from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    OWASP security hardening middleware enforcing secure response headers:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY (clickjacking protection)
    - X-XSS-Protection: 1; mode=block
    - Strict-Transport-Security: max-age=31536000; includeSubDomains (HSTS)
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: geolocation=(), camera=(), microphone=()
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Apply security headers
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Template preview files can be embedded in candidate previews
        path = request.url.path
        if "/templates/file/" in path:
            response.headers.pop("X-Frame-Options", None)
            response.headers["Content-Security-Policy"] = "frame-ancestors *"
        else:
            response.headers["X-Frame-Options"] = "DENY"

        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"

        # HSTS on production / non-plain connections
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response
