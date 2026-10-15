from urllib.parse import urlparse


_PROFILE_HOSTS = {
    "github": {"github.com", "www.github.com"},
    "linkedin": {"linkedin.com", "www.linkedin.com"},
}


def clean_social_profile_url(value: str | None, provider: str) -> str | None:
    """Treat a provider home page as missing profile data while preserving real profile URLs."""
    if not value or not value.strip():
        return None

    cleaned = value.strip()
    candidate = cleaned if "://" in cleaned else f"https://{cleaned}"
    try:
        parsed = urlparse(candidate)
    except ValueError:
        return cleaned

    hosts = _PROFILE_HOSTS.get(provider, set())
    if parsed.hostname and parsed.hostname.lower() in hosts and not parsed.path.strip("/"):
        return None
    return cleaned
