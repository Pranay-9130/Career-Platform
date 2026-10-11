import pytest
from app.core.rate_limiter import (
    auth_rate_limiter,
    contact_rate_limiter,
    ai_rate_limiter,
    general_rate_limiter,
)

@pytest.fixture(autouse=True)
def reset_rate_limiters_per_test():
    """
    Ensure rate limiters start with an empty sliding window for each unit test,
    preventing cross-test pollution while keeping rate limiting fully enabled.
    """
    auth_rate_limiter.reset()
    contact_rate_limiter.reset()
    ai_rate_limiter.reset()
    general_rate_limiter.reset()
    yield
    auth_rate_limiter.reset()
    contact_rate_limiter.reset()
    ai_rate_limiter.reset()
    general_rate_limiter.reset()
