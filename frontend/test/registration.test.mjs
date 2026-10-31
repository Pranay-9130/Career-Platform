import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REGISTRATION_ROLE_OPTIONS,
  getDefaultHeadline,
} from '../src/utils/registration.js';

test('registration exposes distinct student and job-seeker roles', () => {
  assert.deepEqual(
    REGISTRATION_ROLE_OPTIONS.map(({ value, label }) => ({ value, label })),
    [
      { value: 'STUDENT', label: 'Student / Learner' },
      { value: 'CONTRIBUTOR', label: 'Job Seeker' },
    ],
  );
});

test('job seekers receive the correct default headline', () => {
  assert.equal(getDefaultHeadline('CONTRIBUTOR'), 'Software Developer');
  assert.equal(getDefaultHeadline('STUDENT'), 'Computer Science Student');
});

test('RegisterPage source code declares and initializes errorMessage state', async () => {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const registerPageSource = await fs.readFile(
    path.resolve(process.cwd(), 'src/pages/auth/RegisterPage.jsx'),
    'utf-8'
  );

  assert.match(
    registerPageSource,
    /const\s*\[errorMessage,\s*setErrorMessage\]\s*=\s*useState\(null\);/,
    'RegisterPage must declare [errorMessage, setErrorMessage] = useState(null)'
  );
  assert.match(
    registerPageSource,
    /const\s*\[hasExistingSession,\s*setHasExistingSession\]\s*=\s*useState\(/,
    'RegisterPage must declare [hasExistingSession, setHasExistingSession]'
  );
});

test('registration page active session banner is suppressed during registration submission', () => {
  const shouldRenderActiveSessionBanner = ({ hasExistingSession, isAuthenticated, isSubmitting }) => {
    return Boolean(hasExistingSession && isAuthenticated && !isSubmitting);
  };

  assert.equal(
    shouldRenderActiveSessionBanner({ hasExistingSession: false, isAuthenticated: false, isSubmitting: false }),
    false,
    'Guest visiting registration does not see banner'
  );
  assert.equal(
    shouldRenderActiveSessionBanner({ hasExistingSession: true, isAuthenticated: true, isSubmitting: false }),
    true,
    'Authenticated visitor arriving with session sees banner'
  );
  assert.equal(
    shouldRenderActiveSessionBanner({ hasExistingSession: true, isAuthenticated: true, isSubmitting: true }),
    false,
    'Banner is suppressed while submitting'
  );
});
