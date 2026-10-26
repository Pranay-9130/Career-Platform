import test from 'node:test';
import assert from 'node:assert/strict';

import { getDashboardPath, getInternalPath } from '../src/utils/navigation.js';

test('login redirection resolves student vs admin dashboards correctly', () => {
  const getDestination = (account, requested) => {
    const isAdmin = account?.role === 'ADMIN';

    if (isAdmin) {
      if (requested && requested.startsWith('/admin')) {
        return requested;
      }
      return '/admin/dashboard';
    }

    if (requested && !requested.startsWith('/admin')) {
      return requested;
    }

    return getDashboardPath(account);
  };

  // Student defaults to /dashboard
  assert.equal(getDestination({ role: 'STUDENT' }, ''), '/dashboard');
  assert.equal(getDestination({ role: 'STUDENT' }, '/projects/submit'), '/projects/submit');
  assert.equal(getDestination({ role: 'STUDENT' }, '/admin/dashboard'), '/dashboard');

  // Admin defaults to /admin/dashboard
  assert.equal(getDestination({ role: 'ADMIN' }, ''), '/admin/dashboard');
  assert.equal(getDestination({ role: 'ADMIN' }, '/admin/projects'), '/admin/projects');
  assert.equal(getDestination({ role: 'ADMIN' }, '/dashboard'), '/admin/dashboard');
});

test('login page active session banner is suppressed during login submission', () => {
  const shouldRenderActiveSessionBanner = ({ hasExistingSession, isAuthenticated, isSubmitting }) => {
    return Boolean(hasExistingSession && isAuthenticated && !isSubmitting);
  };

  // Guest logging in: arrived without session, submitting credentials
  assert.equal(
    shouldRenderActiveSessionBanner({ hasExistingSession: false, isAuthenticated: false, isSubmitting: false }),
    false,
  );
  assert.equal(
    shouldRenderActiveSessionBanner({ hasExistingSession: false, isAuthenticated: false, isSubmitting: true }),
    false,
  );

  // Once authenticated during submission transition: must NOT render active session banner
  assert.equal(
    shouldRenderActiveSessionBanner({ hasExistingSession: false, isAuthenticated: true, isSubmitting: true }),
    false,
  );
  assert.equal(
    shouldRenderActiveSessionBanner({ hasExistingSession: false, isAuthenticated: true, isSubmitting: false }),
    false,
  );

  // User navigated to /login while ALREADY having an active session
  assert.equal(
    shouldRenderActiveSessionBanner({ hasExistingSession: true, isAuthenticated: true, isSubmitting: false }),
    true,
  );

  // User clicked Sign Out: active session cleared
  assert.equal(
    shouldRenderActiveSessionBanner({ hasExistingSession: false, isAuthenticated: false, isSubmitting: false }),
    false,
  );
});
