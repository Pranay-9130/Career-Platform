import time
from typing import Dict, List, Optional
from fastapi import Request, HTTPException, status


class SlidingWindowRateLimiter:
    """
    In-memory sliding-window rate limiter protecting API routes from brute-force
    attacks, credential stuffing, inquiry spamming, and AI quota exhaustion.
    """

    def __init__(self, max_requests: int, window_seconds: int, name: str = "RateLimiter"):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.name = name
        # Mapping: client_identifier -> list of timestamps
        self._history: Dict[str, List[float]] = {}

    def _get_client_id(self, request: Request) -> str:
        # Check for proxy forwarding headers or client host
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "127.0.0.1"
        return f"{self.name}:{ip}"

    def check(self, client_id: str) -> None:
        now = time.time()
        window_start = now - self.window_seconds

        timestamps = self._history.get(client_id, [])
        # Prune older than sliding window
        valid_timestamps = [t for t in timestamps if t > window_start]

        if len(valid_timestamps) >= self.max_requests:
            retry_after = int(self.window_seconds - (now - valid_timestamps[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests to {self.name}. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(max(1, retry_after))},
            )

        valid_timestamps.append(now)
        self._history[client_id] = valid_timestamps

    async def __call__(self, request: Request):
        client_id = self._get_client_id(request)
        self.check(client_id)

    def reset(self):
        """Reset internal history for unit testing isolation."""
        self._history.clear()


# Pre-configured security rate limiters
auth_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60, name="AuthLimiter")
contact_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60, name="ContactLimiter")
ai_rate_limiter = SlidingWindowRateLimiter(max_requests=20, window_seconds=60, name="AILimiter")
general_rate_limiter = SlidingWindowRateLimiter(max_requests=120, window_seconds=60, name="GeneralLimiter")
