/**
 * Authentication and session error classification utilities.
 */

export const isSessionRejection = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

/**
 * Classifies login and authentication request errors into user-friendly,
 * accurate categories according to strict error handling standards.
 *
 * @param {Error|Object} error - Caught Axios or fetch error object
 * @returns {{ type: string, message: string, retryable: boolean, status: number|null }}
 */
export function classifyLoginError(error) {
  // 1. Request Timeout Detection
  const isTimeout =
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT' ||
    (typeof error?.message === 'string' && error.message.toLowerCase().includes('timeout'));

  if (isTimeout) {
    return {
      type: 'TIMEOUT',
      message: 'Login is taking longer than expected. Please try again.',
      retryable: true,
      status: null,
    };
  }

  // 2. Network Connection Failure Detection
  const isOffline = typeof window !== 'undefined' && typeof window.navigator?.onLine === 'boolean' && !window.navigator.onLine;
  const isNetworkFailure =
    isOffline ||
    error?.code === 'ERR_NETWORK' ||
    error?.message === 'Network Error' ||
    (!error?.response && Boolean(error?.request));

  if (isNetworkFailure) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Unable to connect. Please check your internet connection and try again.',
      retryable: true,
      status: null,
    };
  }

  // 3. HTTP Status-Based Error Classification
  const status = error?.response?.status;

  // 401 Unauthorized: Incorrect Credentials only
  if (status === 401) {
    return {
      type: 'INVALID_CREDENTIALS',
      message: 'Incorrect email or password. Please check your details and try again.',
      retryable: true,
      status: 401,
    };
  }

  // 403 Forbidden: Origin rejected or permission error
  if (status === 403) {
    const detail = error?.response?.data?.detail;
    return {
      type: 'FORBIDDEN',
      message: detail || 'Access denied. You do not have permission to log in.',
      retryable: false,
      status: 403,
    };
  }

  // 429 Too Many Requests (Rate Limiter)
  if (status === 429) {
    return {
      type: 'RATE_LIMIT',
      message: 'Too many login attempts. Please wait a moment before trying again.',
      retryable: true,
      status: 429,
    };
  }

  // 400 Bad Request (Deactivated account or validation failure)
  if (status === 400) {
    const detail = error?.response?.data?.detail;
    return {
      type: 'BAD_REQUEST',
      message: detail || 'Unable to log in. Please verify your details and try again.',
      retryable: true,
      status: 400,
    };
  }

  // 5xx Server Error / Backend Unavailable
  if (status && status >= 500) {
    return {
      type: 'SERVER_ERROR',
      message: 'Our server is temporarily unavailable. Please try again shortly.',
      retryable: true,
      status,
    };
  }

  // 4. Fallback Unexpected Error
  return {
    type: 'UNEXPECTED',
    message: 'An unexpected error occurred during login. Please try again.',
    retryable: true,
    status: status || null,
  };
}
