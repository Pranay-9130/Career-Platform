export const getDashboardPath = (user) =>
  user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

export const getInternalPath = (value, fallback = '') => {
  const path = typeof value === 'string'
    ? value
    : value
      ? `${value.pathname || ''}${value.search || ''}${value.hash || ''}`
      : '';

  return path.startsWith('/') && !path.startsWith('//') ? path : fallback;
};
