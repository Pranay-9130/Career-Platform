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
            if "X-Frame-Options" in response.headers:
                del response.headers["X-Frame-Options"]
            response.headers["Content-Security-Policy"] = "frame-ancestors *"
        else:
            response.headers["X-Frame-Options"] = "DENY"

        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"

        # HSTS on production / non-plain connections
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


import time
import logging

perf_logger = logging.getLogger("aspirepath.perf")

class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Measures end-to-end request duration, appends the X-Process-Time-Ms header,
    and logs structured latency metrics while guaranteeing no secrets or tokens are exposed.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Process-Time-Ms"] = str(duration_ms)

        path = request.url.path
        if path.startswith("/api"):
            if duration_ms > 500:
                perf_logger.warning("SLOW_REQUEST: %s %s [%d] in %.2fms", request.method, path, response.status_code, duration_ms)
            else:
                perf_logger.info("API_PERF: %s %s [%d] in %.2fms", request.method, path, response.status_code, duration_ms)

        return response
