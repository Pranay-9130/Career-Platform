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
