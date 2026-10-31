import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ELIGIBLE_BATCH_OPTIONS,
  CANDIDATE_TYPE_OPTIONS,
  ELIGIBLE_QUALIFICATION_OPTIONS,
  getJobEligibilityDetails,
  checkProfileEligibilityMatch,
} from '../src/utils/jobHelpers.js';

test('ELIGIBLE_BATCH_OPTIONS provides standard years and All Batches', () => {
  assert.ok(ELIGIBLE_BATCH_OPTIONS.includes('2023'));
  assert.ok(ELIGIBLE_BATCH_OPTIONS.includes('2024'));
  assert.ok(ELIGIBLE_BATCH_OPTIONS.includes('2025'));
  assert.ok(ELIGIBLE_BATCH_OPTIONS.includes('2026'));
  assert.ok(ELIGIBLE_BATCH_OPTIONS.includes('2027'));
  assert.ok(ELIGIBLE_BATCH_OPTIONS.includes('2028'));
  assert.ok(ELIGIBLE_BATCH_OPTIONS.includes('2029'));
  assert.ok(ELIGIBLE_BATCH_OPTIONS.includes('All Batches'));
});

test('CANDIDATE_TYPE_OPTIONS defines the three specified options', () => {
  assert.deepEqual(CANDIDATE_TYPE_OPTIONS, [
    'Freshers Only',
    'Experienced Only',
    'Both Freshers and Experienced',
  ]);
});

test('ELIGIBLE_QUALIFICATION_OPTIONS defines the expected degrees', () => {
  const expected = [
    'B.Tech',
    'B.E.',
    'M.Tech',
    'M.E.',
    'BCA',
    'MCA',
    'B.Sc',
    'M.Sc',
    'MBA',
    'Diploma',
    'Other',
  ];
  assert.deepEqual(ELIGIBLE_QUALIFICATION_OPTIONS, expected);
});

test('getJobEligibilityDetails extracts values and gracefully formats unspecified fields', () => {
  // 1. Specified job
  const job = {
    eligible_batches: ['2025', '2026'],
    candidate_type: 'Freshers Only',
    eligible_qualifications: ['B.Tech', 'MCA'],
  };
  const details = getJobEligibilityDetails(job);
  assert.equal(details.batchesText, '2025, 2026');
  assert.equal(details.candidateTypeText, 'Freshers Only');
  assert.equal(details.qualificationsText, 'B.Tech, MCA');
  assert.equal(details.hasAnyEligibility, true);

  // 2. Unspecified job
  const unspecifiedJob = {};
  const unspecifiedDetails = getJobEligibilityDetails(unspecifiedJob);
  assert.equal(unspecifiedDetails.batchesText, 'Not Specified');
  assert.equal(unspecifiedDetails.candidateTypeText, 'Not Specified');
  assert.equal(unspecifiedDetails.qualificationsText, 'Not Specified');
  assert.equal(unspecifiedDetails.hasAnyEligibility, false);
});

test('checkProfileEligibilityMatch evaluates matching status correctly', () => {
  const job = {
    eligible_batches: ['2025', '2026'],
    candidate_type: 'Freshers Only',
    eligible_qualifications: ['B.Tech', 'MCA'],
  };

  // 1. Matching student
  const matchingStudent = {
    graduation_year: 2026,
    degree: 'B.Tech in Computer Science',
  };
  const resMatch = checkProfileEligibilityMatch(job, matchingStudent);
  assert.equal(resMatch.status, 'match');

  // 2. Student matching All Batches job
  const allBatchesJob = {
    eligible_batches: ['All Batches'],
    candidate_type: 'Freshers Only',
    eligible_qualifications: ['B.Tech'],
  };
  const resAllBatches = checkProfileEligibilityMatch(allBatchesJob, {
    graduation_year: 2029,
    degree: 'B.Tech IT',
  });
  assert.equal(resAllBatches.status, 'match');

  // 3. Mismatched graduation year
  const mismatchedYearStudent = {
    graduation_year: 2023,
    degree: 'B.Tech in Computer Science',
  };
  const resMismatch = checkProfileEligibilityMatch(job, mismatchedYearStudent);
  assert.equal(resMismatch.status, 'mismatch');

  // 4. Missing profile data
  const missingDataStudent = {};
  const resMissing = checkProfileEligibilityMatch(job, missingDataStudent);
  assert.equal(resMissing.status, 'unknown');

  // 5. Open / unspecified job
  const openJob = {};
  const resOpen = checkProfileEligibilityMatch(openJob, matchingStudent);
  assert.equal(resOpen.status, 'open');

  // 6. Logged out / null profile
  const resLoggedOut = checkProfileEligibilityMatch(job, null);
  assert.equal(resLoggedOut.status, 'unknown');
});
