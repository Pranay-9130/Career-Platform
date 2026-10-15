import pytest
from app.core.rate_limiter import (
    auth_rate_limiter,
    contact_rate_limiter,
    ai_rate_limiter,
    general_rate_limiter,
)
from app.core.config import settings

@pytest.fixture(autouse=True)
def isolate_test_runtime():
    """
    Ensure rate limiters start with an empty sliding window for each unit test,
    preventing cross-test pollution while keeping rate limiting fully enabled.
    """
    auth_rate_limiter.reset()
    contact_rate_limiter.reset()
    ai_rate_limiter.reset()
    general_rate_limiter.reset()
    previous_environment = settings.ENVIRONMENT
    previous_email_provider = settings.EMAIL_PROVIDER
    settings.ENVIRONMENT = "test"
    settings.EMAIL_PROVIDER = "console"
    yield
    settings.ENVIRONMENT = previous_environment
    settings.EMAIL_PROVIDER = previous_email_provider
    auth_rate_limiter.reset()
    contact_rate_limiter.reset()
    ai_rate_limiter.reset()
    general_rate_limiter.reset()
