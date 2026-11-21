import re
from urllib.parse import urlparse
from typing import Optional


_PROFILE_HOSTS = {
    "github": {"github.com", "www.github.com"},
    "linkedin": {"linkedin.com", "www.linkedin.com"},
}

_DISALLOWED_SCHEMES = {"javascript", "data", "vbscript", "file"}
_MARKDOWN_LINK_RE = re.compile(r"^\[.*?\]\((https?://[^\s)]+|[^\s)]+)\)$")


def normalize_profile_url(value: Optional[str], provider: Optional[str] = None) -> Optional[str]:
    """
    Validates and normalizes student profile links and external websites.
    Supports:
      - https://www.linkedin.com/in/username
      - http://linkedin.com/in/username
      - [www.linkedin.com/in/username](http://www.linkedin.com/in/username)
      - www.linkedin.com/in/username
      - linkedin.com/in/username
      - https://example.com, example.com, www.example.com
    If protocol is missing, automatically adds https://.
    Rejects malformed URLs and unsafe schemes (javascript:, data:, etc.).
    For github/linkedin providers, filters out bare homepages without a profile path.
    """
    if not value or not isinstance(value, str):
        return None

    cleaned = value.strip()
    if not cleaned:
        return None

    # Handle pasted markdown format: [label](url)
    md_match = _MARKDOWN_LINK_RE.match(cleaned)
    if md_match:
        cleaned = md_match.group(1).strip()

    # Reject dangerous schemes immediately
    lower_raw = cleaned.lower()
    for scheme in _DISALLOWED_SCHEMES:
        if lower_raw.startswith(f"{scheme}:") or lower_raw.startswith(f"{scheme}&"):
            return None

    # Prepend https:// if protocol is missing
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", cleaned):
        candidate = cleaned
    else:
        if cleaned.startswith("//"):
            candidate = f"https:{cleaned}"
        else:
            candidate = f"https://{cleaned}"

    try:
        parsed = urlparse(candidate)
    except Exception:
        return None

    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        return None

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        return None

    # Hostname must contain at least one dot or be localhost
    if "." not in hostname and hostname != "localhost":
        return None

    # Reject invalid characters or whitespace in host
    if any(char in hostname for char in (" ", "\t", "\r", "\n", "<", ">", '"', "'")):
        return None

    # Provider-specific checks: bare provider homepages are not user profiles
    if provider in _PROFILE_HOSTS:
        allowed_hosts = _PROFILE_HOSTS[provider]
        if hostname in allowed_hosts and not parsed.path.strip("/"):
            return None

    return candidate


def clean_social_profile_url(value: Optional[str], provider: str) -> Optional[str]:
    """Preserved for backwards compatibility across existing routes and services."""
    return normalize_profile_url(value, provider)
