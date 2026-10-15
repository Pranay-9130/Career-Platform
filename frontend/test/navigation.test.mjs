import test from 'node:test';
import assert from 'node:assert/strict';

import { getDashboardPath, getInternalPath } from '../src/utils/navigation.js';

test('dashboard navigation respects the authenticated account role', () => {
  assert.equal(getDashboardPath({ role: 'ADMIN' }), '/admin/dashboard');
  assert.equal(getDashboardPath({ role: 'STUDENT' }), '/dashboard');
  assert.equal(getDashboardPath(null), '/dashboard');
});

test('internal navigation restores string and router location destinations', () => {
  assert.equal(getInternalPath('/jobs/42?source=saved'), '/jobs/42?source=saved');
  assert.equal(
    getInternalPath({ pathname: '/projects/demo', search: '?tab=details', hash: '#readme' }),
    '/projects/demo?tab=details#readme',
  );
});

test('internal navigation rejects external and protocol-relative redirects', () => {
  assert.equal(getInternalPath('https://example.com', '/dashboard'), '/dashboard');
  assert.equal(getInternalPath('//example.com/path', '/dashboard'), '/dashboard');
  assert.equal(getInternalPath(null, '/dashboard'), '/dashboard');
});
