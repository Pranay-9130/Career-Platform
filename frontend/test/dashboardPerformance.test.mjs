import test from 'node:test';
import assert from 'node:assert/strict';
import api, { clearApiCache } from '../src/services/api.js';
import { authStorage } from '../src/services/authStorage.js';
import { authService } from '../src/services/authService.js';

// Polyfill window & storage for Node environment
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

test('Concurrent /users/dashboard-summary requests deduplicate to a single network call', async () => {
  clearApiCache();
  authStorage.setToken('test-student-jwt-1');

  let backendHits = 0;
  api.defaults.adapter = async (config) => {
    if (config.url === '/users/dashboard-summary') {
      backendHits += 1;
      // Simulate 50ms network round-trip
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: {
          stats: { projects_count: 3, active_applications_count: 2, saved_items_count: 5 },
          user: { full_name: 'Alex Rivera' },
        },
      };
    }
    throw new Error(`Unexpected request: ${config.url}`);
  };

  // StudentLayout and DashboardPage both mount and fire at the exact same moment
  const [resA, resB] = await Promise.all([
    api.get('/users/dashboard-summary'),
    api.get('/users/dashboard-summary'),
  ]);

  assert.equal(backendHits, 1, 'Two concurrent calls must deduplicate to exactly 1 network hit');
  assert.equal(resA.data.stats.projects_count, 3);
  assert.equal(resB.data.stats.projects_count, 3);
});

test('Sequential navigation within TTL serves /users/dashboard-summary from cache with 0 network calls', async () => {
  clearApiCache();
  authStorage.setToken('test-student-jwt-2');

  let backendHits = 0;
  api.defaults.adapter = async (config) => {
    if (config.url === '/users/dashboard-summary') {
      backendHits += 1;
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: {
          stats: { projects_count: 4, active_applications_count: 1 },
        },
      };
    }
    throw new Error(`Unexpected request: ${config.url}`);
  };

  // First request populates cache
  const first = await api.get('/users/dashboard-summary');
  assert.equal(backendHits, 1);
  assert.equal(first.data.stats.projects_count, 4);

  // User navigates from /dashboard to /my-projects to /resume-builder (triggers fetchCounts in StudentLayout)
  const nav1 = await api.get('/users/dashboard-summary');
  const nav2 = await api.get('/users/dashboard-summary');

  assert.equal(backendHits, 1, 'Sequential page navigations must not trigger new network requests');
  assert.equal(nav1.data.stats.projects_count, 4);
  assert.equal(nav2.data.stats.projects_count, 4);
  assert.equal(nav1._fromCache, true);
});

test('Mutations to /projects invalidate /users/dashboard-summary cache', async () => {
  clearApiCache();
  authStorage.setToken('test-student-jwt-3');

  let backendHits = 0;
  let projectCount = 2;

  api.defaults.adapter = async (config) => {
    if (config.method === 'get' && config.url === '/users/dashboard-summary') {
      backendHits += 1;
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { stats: { projects_count: projectCount } },
      };
    }
    if (config.method === 'post' && config.url === '/projects') {
      projectCount += 1;
      return {
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
        data: { id: 'proj-new', title: 'New Showcase Project' },
      };
    }
    throw new Error(`Unexpected request: ${config.method} ${config.url}`);
  };

  // 1. Initial cached fetch
  const initial = await api.get('/users/dashboard-summary');
  assert.equal(initial.data.stats.projects_count, 2);
  assert.equal(backendHits, 1);

  // 2. Student submits a new project
  await api.post('/projects', { title: 'New Showcase Project' });

  // 3. Next dashboard request must hit backend for fresh data because cache was invalidated
  const refreshed = await api.get('/users/dashboard-summary');
  assert.equal(backendHits, 2, 'Cache must be invalidated upon project creation');
  assert.equal(refreshed.data.stats.projects_count, 3);
});

test('authService.logout() clears storage and cache immediately without waiting for server response', async () => {
  authStorage.setSession('token-active-123', { id: 'u-1', full_name: 'Test Student' }, true);
  assert.equal(authStorage.getToken(), 'token-active-123');

  let serverLogoutCalled = false;
  let serverLogoutCompleted = false;

  api.defaults.adapter = async (config) => {
    if (config.url && config.url.includes('/auth/logout')) {
      serverLogoutCalled = true;
      // Simulate delayed Render response (150ms)
      await new Promise((resolve) => setTimeout(resolve, 150));
      serverLogoutCompleted = true;
      return { status: 204, statusText: 'No Content', headers: {}, config, data: null };
    }
    throw new Error(`Unexpected request: ${config.url}`);
  };

  // Trigger logout
  const logoutPromise = authService.logout();

  // Client storage MUST be cleared synchronously, with 0ms delay
  assert.equal(authStorage.getToken(), null, 'Token must be wiped immediately on logout call');
  assert.equal(authStorage.getUser(), null, 'User must be wiped immediately on logout call');

  // Allow one microtask for the background network request dispatch
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(serverLogoutCalled, true, 'Server logout request must be dispatched');
  assert.equal(serverLogoutCompleted, false, 'Client did not block waiting for server 150ms latency');

  await logoutPromise;
  assert.equal(serverLogoutCompleted, true);
});

test('login uses a bounded timeout and collapses rapid duplicate submissions', async () => {
  authStorage.clear();
  let backendHits = 0;
  let observedTimeout = null;

  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/login') {
      backendHits += 1;
      observedTimeout = config.timeout;
      await new Promise((resolve) => setTimeout(resolve, 40));
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: {
          access_token: 'single-flight-login-token',
          user: { id: 'login-user', role: 'STUDENT', email: 'student@example.com' },
        },
      };
    }
    throw new Error(`Unexpected request: ${config.url}`);
  };

  const credentials = { email: 'student@example.com', password: 'CorrectPassword123!' };
  const [first, second, third] = await Promise.all([
    authService.login(credentials, true),
    authService.login(credentials, true),
    authService.login(credentials, true),
  ]);

  assert.equal(backendHits, 1, 'rapid clicks must create exactly one login request');
  assert.equal(observedTimeout, 25000);
  assert.equal(first.access_token, 'single-flight-login-token');
  assert.deepEqual(second, first);
  assert.deepEqual(third, first);
});

test('Dashboard cache isolates data per user token and clears completely across account switches', async () => {
  clearApiCache();

  // 1. User A (Student) logs in and queries dashboard
  authStorage.setSession('user-a-token', { id: 'u-a', role: 'STUDENT', full_name: 'Student A' }, true);
  api.defaults.adapter = async (config) => {
    if (config.url === '/users/dashboard-summary') {
      const authHeader = config.headers?.Authorization || '';
      if (authHeader.includes('user-a-token')) {
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { stats: { projects_count: 5 }, user: { full_name: 'Student A' } },
        };
      }
      if (authHeader.includes('user-b-token')) {
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { stats: { projects_count: 0 }, user: { full_name: 'Student B' } },
        };
      }
    }
    if (config.url && config.url.includes('/auth/logout')) {
      return { status: 204, statusText: 'No Content', headers: {}, config, data: null };
    }
    throw new Error(`Unexpected request: ${config.url}`);
  };

  const resA = await api.get('/users/dashboard-summary');
  assert.equal(resA.data.user.full_name, 'Student A');
  assert.equal(resA.data.stats.projects_count, 5);

  // 2. User A logs out
  await authService.logout();
  assert.equal(authStorage.getToken(), null);

  // 3. User B (Student B) logs in
  authStorage.setSession('user-b-token', { id: 'u-b', role: 'STUDENT', full_name: 'Student B' }, true);
  const resB = await api.get('/users/dashboard-summary');

  assert.equal(resB.data.user.full_name, 'Student B', 'User B must see their own data, never User A');
  assert.equal(resB.data.stats.projects_count, 0, 'User B stats must be their own');
});

test('isTokenExpired accurately identifies expired vs valid JWT tokens', async () => {
  const { isTokenExpired } = await import('../src/services/authStorage.js');

  const makeJwt = (expSeconds) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'u1', exp: expSeconds })).toString('base64url');
    const signature = 'fake_signature';
    return `${header}.${payload}.${signature}`;
  };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiredToken = makeJwt(nowSeconds - 3600); // Expired 1 hour ago
  const validToken = makeJwt(nowSeconds + 3600);   // Valid for another hour

  assert.equal(isTokenExpired(expiredToken), true, 'Expired token must return true');
  assert.equal(isTokenExpired(validToken), false, 'Valid future token must return false');
  assert.equal(isTokenExpired('not.a.token'), true, 'Malformed token must return true');
  assert.equal(isTokenExpired(null), true, 'Null token must return true');
});

test('Mutations to applications, resumes, bookmarks, and users all invalidate dashboard summary cache', async () => {
  clearApiCache();
  authStorage.setToken('test-student-jwt-multi');

  let getSummaryHits = 0;
  api.defaults.adapter = async (config) => {
    if (config.method === 'get' && config.url === '/users/dashboard-summary') {
      getSummaryHits += 1;
      return { status: 200, statusText: 'OK', headers: {}, config, data: { hits: getSummaryHits } };
    }
    return { status: 200, statusText: 'OK', headers: {}, config, data: { ok: true } };
  };

  // 1. Initial GET
  await api.get('/users/dashboard-summary');
  assert.equal(getSummaryHits, 1);

  // 2. Cache hit (hits remains 1)
  await api.get('/users/dashboard-summary');
  assert.equal(getSummaryHits, 1);

  // 3. Application mutation
  await api.post('/applications', { job_id: 'j1' });
  await api.get('/users/dashboard-summary');
  assert.equal(getSummaryHits, 2, 'POST /applications must invalidate summary cache');

  // 4. Resume mutation
  await api.put('/resumes/res-1', { title: 'Updated' });
  await api.get('/users/dashboard-summary');
  assert.equal(getSummaryHits, 3, 'PUT /resumes must invalidate summary cache');

  // 5. User profile mutation
  await api.put('/users/me', { full_name: 'Updated Name' });
  await api.get('/users/dashboard-summary');
  assert.equal(getSummaryHits, 4, 'PUT /users/me must invalidate summary cache');

  // 6. Delete project
  await api.delete('/projects/proj-1');
  await api.get('/users/dashboard-summary');
  assert.equal(getSummaryHits, 5, 'DELETE /projects must invalidate summary cache');
});
