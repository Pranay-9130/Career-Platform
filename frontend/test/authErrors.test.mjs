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
  assert.equal(res401.message, 'Incorrect email or password. Please check your details and try again.');

  // 2. Network connection failure (ERR_NETWORK or no response)
  const errNet = { code: 'ERR_NETWORK', message: 'Network Error' };
  const resNet = classifyLoginError(errNet);
  assert.equal(resNet.type, 'NETWORK_ERROR');
  assert.equal(resNet.message, 'Unable to connect. Please check your internet connection and try again.');

  const errNoResponse = { request: {} };
  const resNoResponse = classifyLoginError(errNoResponse);
  assert.equal(resNoResponse.type, 'NETWORK_ERROR');
  assert.equal(resNoResponse.message, 'Unable to connect. Please check your internet connection and try again.');

  // 3. Backend unavailable / server error (HTTP 5xx)
  const err500 = { response: { status: 500 } };
  const res500 = classifyLoginError(err500);
  assert.equal(res500.type, 'SERVER_ERROR');
  assert.equal(res500.message, 'Our server is temporarily unavailable. Please try again shortly.');

  const err502 = { response: { status: 502 } };
  const res502 = classifyLoginError(err502);
  assert.equal(res502.type, 'SERVER_ERROR');
  assert.equal(res502.message, 'Our server is temporarily unavailable. Please try again shortly.');

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
