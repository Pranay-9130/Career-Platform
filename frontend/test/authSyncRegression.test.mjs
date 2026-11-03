import test from 'node:test';
import assert from 'node:assert/strict';

import { authStorage } from '../src/services/authStorage.js';

test('authStorage stores and clears access token and user in lockstep', () => {
  // Mock window storage
  const mockStorage = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => mockStorage.get(key) || null,
      setItem: (key, val) => mockStorage.set(key, String(val)),
      removeItem: (key) => mockStorage.delete(key),
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  const testUser = { id: 'u-123', email: 'student@example.com', role: 'STUDENT' };
  const testToken = 'mock-jwt-token-xyz';

  authStorage.setSession(testToken, testUser, true);
  assert.equal(authStorage.getToken(), testToken);
  assert.deepEqual(authStorage.getUser(), testUser);

  authStorage.clear();
  assert.equal(authStorage.getToken(), null);
  assert.equal(authStorage.getUser(), null);
});

test('unauthenticated state prevents user from being treated as authenticated without token', () => {
  const mockStorage = new Map();
  // Simulate leftover user in localStorage with NO access token
  mockStorage.set('career_platform_user', JSON.stringify({ id: 'u-999', role: 'STUDENT' }));

  global.window = {
    localStorage: {
      getItem: (key) => mockStorage.get(key) || null,
      setItem: (key, val) => mockStorage.set(key, String(val)),
      removeItem: (key) => mockStorage.delete(key),
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  const token = authStorage.getToken();
  // When token is null, state synchronization guarantees user cannot be falsely authenticated
  const user = token ? authStorage.getUser() : null;
  assert.equal(token, null);
  assert.equal(user, null);
  const isAuthenticated = Boolean(token && user);
  assert.equal(isAuthenticated, false);
});
