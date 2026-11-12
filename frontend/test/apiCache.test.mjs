import test from 'node:test';
import assert from 'node:assert/strict';
import api, { clearApiCache, invalidateRelatedCache } from '../src/services/api.js';
import { authStorage } from '../src/services/authStorage.js';

// Minimal localStorage/sessionStorage/window polyfill for Node test environment
if (typeof globalThis.window === 'undefined') {
  const makeStorage = () => {
    const store = new Map();
    return {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  };
  globalThis.localStorage = makeStorage();
  globalThis.sessionStorage = makeStorage();
  globalThis.window = {
    location: { hostname: 'localhost' },
    dispatchEvent: () => {},
    localStorage: globalThis.localStorage,
    sessionStorage: globalThis.sessionStorage,
  };
}

test('POST /applications invalidates cached GET /jobs/:id so has_applied refreshes immediately', async () => {
  clearApiCache();
  authStorage.setToken('student-token-A');

  let jobFetchCount = 0;
  let hasAppliedState = false;

  api.defaults.adapter = async (config) => {
    if (config.method === 'get' && config.url === '/jobs/job-123') {
      jobFetchCount += 1;
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { id: 'job-123', has_applied: hasAppliedState },
      };
    }
    if (config.method === 'post' && config.url === '/applications') {
      hasAppliedState = true;
      return {
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
        data: { id: 'app-1', job_id: 'job-123' },
      };
    }
    throw new Error(`Unexpected request: ${config.method} ${config.url}`);
  };

  // 1. First GET populates cache (has_applied: false)
  const first = await api.get('/jobs/job-123');
  assert.equal(first.data.has_applied, false);
  assert.equal(jobFetchCount, 1);

  // 2. Second GET hits cache
  const second = await api.get('/jobs/job-123');
  assert.equal(second.data.has_applied, false);
  assert.equal(second._fromCache, true);
  assert.equal(jobFetchCount, 1);

  // 3. Submit application (POST /applications)
  await api.post('/applications', { job_id: 'job-123' });

  // 4. Subsequent GET /jobs/job-123 must bypass stale cache and fetch updated has_applied: true
  const third = await api.get('/jobs/job-123');
  assert.equal(third.data.has_applied, true);
  assert.equal(third._fromCache, undefined);
  assert.equal(jobFetchCount, 2);

  clearApiCache();
  authStorage.clear();
});

test('API response cache isolates authenticated responses per user token', async () => {
  clearApiCache();

  api.defaults.adapter = async (config) => {
    const authHeader = config.headers?.Authorization || '';
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { userTokenEcho: authHeader },
    };
  };

  authStorage.setToken('token-user-1');
  const res1 = await api.get('/jobs/job-999');
  assert.equal(res1.data.userTokenEcho, 'Bearer token-user-1');

  authStorage.setToken('token-user-2');
  const res2 = await api.get('/jobs/job-999');
  assert.equal(res2.data.userTokenEcho, 'Bearer token-user-2');
  assert.equal(res2._fromCache, undefined);

  clearApiCache();
  authStorage.clear();
});
