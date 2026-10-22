/**
 * Utility to resolve project media URLs (images, cover banners, screenshots)
 * ensuring relative API paths properly point to the active backend origin.
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs, Blob URLs, or file URLs
  if (/^(data:|blob:|file:)/i.test(trimmed)) {
    return trimmed;
  }

  // Absolute URLs (http://, https://, or //)
  if (/^(https?:)?\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Relative API paths starting with /api/
  if (trimmed.startsWith('/api/')) {
    const rawEnv = import.meta.env.VITE_API_BASE_URL?.trim();
    if (rawEnv && rawEnv !== '/api') {
      let base = rawEnv.replace(/\/+$/, '');
      if (!base.startsWith('http://') && !base.startsWith('https://')) {
        base = `https://${base}`;
      }
      base = base.replace(/\/api$/, '');
      return `${base}${trimmed}`;
    }
    // Same-origin relative path works with Vercel and local dev proxies
    return trimmed;
  }

  // Relative path starting with /
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return trimmed;
}

export default resolveMediaUrl;
