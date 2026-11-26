import test from 'node:test';
import assert from 'node:assert/strict';

import { isSessionRejection, classifyLoginError } from '../src/services/authErrors.js';

test('only definitive authentication responses reject the browser session', () => {
  assert.equal(isSessionRejection({ response: { status: 401 } }), true);
  assert.equal(isSessionRejection({ response: { status: 403 } }), true);
  assert.equal(isSessionRejection({ response: { status: 500 } }), false);
  assert.equal(isSessionRejection({ code: 'ECONNABORTED' }), false);
  assert.equal(isSessionRejection(undefined), false);
});

test('classifyLoginError distinguishes between invalid credentials and other errors', () => {
  // 1. Invalid credentials (HTTP 401 only)
  const err401 = { response: { status: 401, data: { detail: 'Invalid email or password.' } } };
  const res401 = classifyLoginError(err401);
  assert.equal(res401.type, 'INVALID_CREDENTIALS');
  assert.equal(res401.message, 'Invalid email or password.');

  // 2. Network connection failure (ERR_NETWORK or no response)
  const errNet = { code: 'ERR_NETWORK', message: 'Network Error' };
  const resNet = classifyLoginError(errNet);
  assert.equal(resNet.type, 'NETWORK_ERROR');
  assert.equal(resNet.message, 'The login request could not reach AspirePath. Check your connection and try again.');

  const errNoResponse = { request: {} };
  const resNoResponse = classifyLoginError(errNoResponse);
  assert.equal(resNoResponse.type, 'NETWORK_ERROR');
  assert.equal(resNoResponse.message, 'The login request could not reach AspirePath. Check your connection and try again.');

  // 3. Backend unavailable / server error (HTTP 5xx)
  const err500 = { response: { status: 500 } };
  const res500 = classifyLoginError(err500);
  assert.equal(res500.type, 'SERVER_ERROR');
  assert.equal(res500.message, 'AspirePath encountered a server error. Please try again shortly.');

  const err502 = { response: { status: 502 } };
  const res502 = classifyLoginError(err502);
  assert.equal(res502.type, 'BACKEND_UNAVAILABLE');
  assert.equal(res502.message, 'AspirePath is temporarily unavailable. Please try again shortly.');

  // 4. Request timeout (ECONNABORTED or timeout message)
  const errTimeout = { code: 'ECONNABORTED', message: 'timeout of 30000ms exceeded' };
  const resTimeout = classifyLoginError(errTimeout);
  assert.equal(resTimeout.type, 'TIMEOUT');
  assert.equal(resTimeout.message, 'Login is taking longer than expected. Please try again.');

  // 5. Unexpected errors
  const errUnknown = new Error('Something broke');
  const resUnknown = classifyLoginError(errUnknown);
  assert.equal(resUnknown.type, 'UNEXPECTED');
  assert.equal(resUnknown.message, 'An unexpected error occurred during login. Please try again.');
});

test('classifyLoginError covers every retryable infrastructure response without calling it invalid credentials', () => {
  for (const status of [502, 503, 504]) {
    const result = classifyLoginError({ response: { status } });
    assert.equal(result.type, 'BACKEND_UNAVAILABLE');
    assert.notEqual(result.type, 'INVALID_CREDENTIALS');
    assert.equal(result.retryable, true);
  }

  const databaseFailure = classifyLoginError({
    response: {
      status: 503,
      data: {
        detail: {
          code: 'AUTH_DATABASE_UNAVAILABLE',
          message: 'The sign-in service cannot reach its database right now. Please try again shortly.',
        },
      },
    },
  });
  assert.equal(databaseFailure.type, 'DATABASE_UNAVAILABLE');
  assert.match(databaseFailure.message, /database/i);

  const rateLimit = classifyLoginError({ response: { status: 429 } });
  assert.equal(rateLimit.type, 'RATE_LIMIT');
  assert.equal(rateLimit.retryable, true);

  const forbidden = classifyLoginError({ response: { status: 403 } });
  assert.equal(forbidden.type, 'FORBIDDEN');
  assert.notEqual(forbidden.type, 'INVALID_CREDENTIALS');
});

test('disconnected internet is reported as offline, never invalid credentials', () => {
  const previousWindow = globalThis.window;
  globalThis.window = { navigator: { onLine: false } };
  try {
    const result = classifyLoginError({ code: 'ERR_NETWORK', message: 'Network Error' });
    assert.equal(result.type, 'OFFLINE');
    assert.match(result.message, /offline/i);
    assert.notEqual(result.type, 'INVALID_CREDENTIALS');
  } finally {
    globalThis.window = previousWindow;
  }
});
