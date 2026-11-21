/**
 * Profile & External URL Normalization and Security Utilities
 *
 * Supports input formats:
 * - https://www.linkedin.com/in/username
 * - http://linkedin.com/in/username
 * - [www.linkedin.com/in/username](http://www.linkedin.com/in/username)
 * - www.linkedin.com/in/username
 * - linkedin.com/in/username
 * - https://example.com, http://example.com, example.com, www.example.com
 *
 * Normalizes valid URLs missing a protocol to use https://.
 * Rejects unsafe schemes (javascript:, data:, etc.) and malformed URLs.
 * Guarantees external links open safely in a new tab without routing to 404 in React Router.
 */

const PROVIDER_HOSTS = {
  github: new Set(['github.com', 'www.github.com']),
  linkedin: new Set(['linkedin.com', 'www.linkedin.com']),
};

const DISALLOWED_SCHEMES = new Set(['javascript:', 'data:', 'vbscript:', 'file:']);
const MARKDOWN_LINK_RE = /^\[.*?\]\((https?:\/\/[^\s)]+|[^\s)]+)\)$/;

/**
 * Normalizes a raw profile or website URL string to a safe, valid absolute URL.
 * Automatically adds 'https://' if protocol is missing.
 * Rejects unsafe schemes (javascript:, data:, etc.) and malformed URLs.
 * Returns null if invalid or missing.
 */
export const normalizeProfileUrl = (value, provider = null) => {
  if (!value || typeof value !== 'string') return null;

  let cleaned = value.trim();
  if (!cleaned) return null;

  // Handle pasted markdown format [label](url)
  const mdMatch = cleaned.match(MARKDOWN_LINK_RE);
  if (mdMatch) {
    cleaned = mdMatch[1].trim();
  }

  // Reject dangerous schemes immediately
  const lower = cleaned.toLowerCase();
  for (const scheme of DISALLOWED_SCHEMES) {
    if (lower.startsWith(scheme)) return null;
  }

  // Prepend https:// if protocol is missing
  let candidate = cleaned;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(cleaned)) {
    if (cleaned.startsWith('//')) {
      candidate = `https:${cleaned}`;
    } else {
      candidate = `https://${cleaned}`;
    }
  }

  try {
    const parsed = new URL(candidate);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return null;

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || (!hostname.includes('.') && hostname !== 'localhost')) {
      return null;
    }

    // Reject spaces or invalid characters in host
    if (/[\s<>"']/.test(hostname)) return null;

    // Filter out bare provider homepages without a username/path
    if (provider && PROVIDER_HOSTS[provider]?.has(hostname)) {
      const path = parsed.pathname.replace(/^\/+|\/+$/g, '');
      if (!path) return null;
    }

    return candidate;
  } catch {
    return null;
  }
};

/**
 * Returns a guaranteed-safe absolute external URL for use in href, or null if invalid.
 * Prevents relative route navigation and ensures external links never 404 in React Router.
 */
export const getSafeExternalUrl = (value, provider = null) => {
  return normalizeProfileUrl(value, provider);
};

/**
 * Validates whether a profile URL input is valid or empty (empty is allowed for optional fields).
 */
export const isValidProfileUrl = (value, provider = null) => {
  if (!value || typeof value !== 'string' || !value.trim()) return true;
  return normalizeProfileUrl(value, provider) !== null;
};

/**
 * Backwards-compatible helper for legacy imports.
 */
export const cleanSocialProfileUrl = (value, provider) => {
  const normalized = normalizeProfileUrl(value, provider);
  return normalized || '';
};
