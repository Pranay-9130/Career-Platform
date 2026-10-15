const PROVIDER_HOSTS = {
  github: new Set(['github.com', 'www.github.com']),
  linkedin: new Set(['linkedin.com', 'www.linkedin.com']),
};

export const cleanSocialProfileUrl = (value, provider) => {
  const cleaned = typeof value === 'string' ? value.trim() : '';
  if (!cleaned) return '';

  try {
    const parsed = new URL(cleaned.includes('://') ? cleaned : `https://${cleaned}`);
    if (PROVIDER_HOSTS[provider]?.has(parsed.hostname.toLowerCase()) && parsed.pathname === '/') {
      return '';
    }
  } catch {
    return cleaned;
  }

  return cleaned;
};
