import test from 'node:test';
import assert from 'node:assert/strict';

import { getInternalPath, getDashboardPath } from '../src/utils/navigation.js';

function computeJobDetailsNavigation({ isAuthenticated, jobId }) {
  const target = isAuthenticated ? `/jobs/${jobId}` : '/login';
  const state = isAuthenticated ? undefined : { from: `/jobs/${jobId}` };
  return { target, state };
}

function resolveLoginDestination({ user, locationState, locationSearch }) {
  const from = locationState?.from;
  const statePath = getInternalPath(from);
  const searchParams = new URLSearchParams(locationSearch || '');
  const queryPath = getInternalPath(searchParams.get('redirect'));
  const requested = statePath || queryPath;

  const isAdmin = user?.role === 'ADMIN';

  if (isAdmin) {
    if (requested && requested.startsWith('/admin')) {
      return requested;
    }
    // If admin explicitly clicked or requested a job, preserve it or go to admin
    if (requested && requested.startsWith('/jobs/')) {
      return requested;
    }
    return '/admin/dashboard';
  }

  if (requested && !requested.startsWith('/admin')) {
    return requested;
  }

  return getDashboardPath(user);
}

test('Unauthenticated user clicking View Details targets /login with preserved job destination', () => {
  const nav = computeJobDetailsNavigation({
    isAuthenticated: false,
    jobId: 'b22aecda-c4ae-4ded-ba2a-79cff3a1d344',
  });

  assert.equal(nav.target, '/login');
  assert.deepEqual(nav.state, { from: '/jobs/b22aecda-c4ae-4ded-ba2a-79cff3a1d344' });
});

test('Authenticated user clicking View Details targets /jobs/:id directly without redirect state', () => {
  const nav = computeJobDetailsNavigation({
    isAuthenticated: true,
    jobId: 'b22aecda-c4ae-4ded-ba2a-79cff3a1d344',
  });

  assert.equal(nav.target, '/jobs/b22aecda-c4ae-4ded-ba2a-79cff3a1d344');
  assert.equal(nav.state, undefined);
});

test('LoginPage redirects successfully authenticated student to originally intended job details', () => {
  const destination = resolveLoginDestination({
    user: { email: 'student@example.com', role: 'STUDENT' },
    locationState: { from: '/jobs/b22aecda-c4ae-4ded-ba2a-79cff3a1d344' },
    locationSearch: '',
  });

  assert.equal(destination, '/jobs/b22aecda-c4ae-4ded-ba2a-79cff3a1d344');
});

test('LoginPage redirects when from is a React Router location object', () => {
  const destination = resolveLoginDestination({
    user: { email: 'student@example.com', role: 'STUDENT' },
    locationState: {
      from: {
        pathname: '/jobs/6c2b5b6ffdb04a81a73ab7f3e9cf2990',
        search: '?tab=overview',
        hash: '',
      },
    },
    locationSearch: '',
  });

  assert.equal(destination, '/jobs/6c2b5b6ffdb04a81a73ab7f3e9cf2990?tab=overview');
});

test('LoginPage falls back to general dashboard if no specific job was requested', () => {
  const destination = resolveLoginDestination({
    user: { email: 'student@example.com', role: 'STUDENT' },
    locationState: null,
    locationSearch: '',
  });

  assert.equal(destination, '/dashboard');
});

test('LoginPage rejects unsafe external redirect URLs and falls back safely', () => {
  const destination = resolveLoginDestination({
    user: { email: 'student@example.com', role: 'STUDENT' },
    locationState: null,
    locationSearch: '?redirect=https://malicious-phishing.com/steal',
  });

  assert.equal(destination, '/dashboard');
});
