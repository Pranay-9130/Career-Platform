import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ELIGIBLE_BATCH_OPTIONS,
  CANDIDATE_TYPE_OPTIONS,
  ELIGIBLE_QUALIFICATION_OPTIONS,
  EXPERIENCE_REQUIREMENT_OPTIONS,
  formatCustomExperience,
  parseExperienceRequirements,
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

test('EXPERIENCE_REQUIREMENT_OPTIONS defines preset options', () => {
  const expected = [
    'Fresher (0 Years)',
    '0–1 Years',
    '1–2 Years',
    '2–3 Years',
    '3–5 Years',
    '5–8 Years',
    '8+ Years',
  ];
  assert.deepEqual(EXPERIENCE_REQUIREMENT_OPTIONS, expected);
});

test('formatCustomExperience formats min and max into standardized string', () => {
  // Empty inputs
  assert.equal(formatCustomExperience('', ''), '');
  assert.equal(formatCustomExperience(null, null), '');

  // Min only (open-ended e.g. 3+ years)
  assert.equal(formatCustomExperience(3, ''), '3+ Years');
  assert.equal(formatCustomExperience('3', ''), '3+ Years');
  assert.equal(formatCustomExperience(0, ''), '0+ Years');

  // Min and Max range
  assert.equal(formatCustomExperience(3, 5), '3–5 Years');
  assert.equal(formatCustomExperience('3', '5'), '3–5 Years');
  assert.equal(formatCustomExperience(0, 2), '0–2 Years');

  // Min == Max
  assert.equal(formatCustomExperience(2, 2), '2 Years');
  assert.equal(formatCustomExperience(0, 0), 'Fresher (0 Years)');

  // Invalid: max < min
  assert.equal(formatCustomExperience(5, 3), '');

  // Invalid: negative numbers
  assert.equal(formatCustomExperience(-1, 5), '');
});

test('parseExperienceRequirements correctly identifies presets vs custom ranges', () => {
  // Preset options
  const fresher = parseExperienceRequirements('Fresher (0 Years)');
  assert.equal(fresher.isPreset, true);
  assert.equal(fresher.preset, 'Fresher (0 Years)');

  const threeToFive = parseExperienceRequirements('3–5 Years');
  assert.equal(threeToFive.isPreset, true);
  assert.equal(threeToFive.preset, '3–5 Years');

  // Open-ended custom: 3+ Years
  const openEnded = parseExperienceRequirements('3+ Years');
  assert.equal(openEnded.isPreset, false);
  assert.equal(openEnded.min, '3');
  assert.equal(openEnded.max, '');

  // Custom range: 4–7 Years
  const customRange = parseExperienceRequirements('4–7 Years');
  assert.equal(customRange.isPreset, false);
  assert.equal(customRange.min, '4');
  assert.equal(customRange.max, '7');

  // Single year custom: 4 Years
  const singleCustom = parseExperienceRequirements('4 Years');
  assert.equal(singleCustom.isPreset, false);
  assert.equal(singleCustom.min, '4');
  assert.equal(singleCustom.max, '4');

  // Unspecified or null
  const empty = parseExperienceRequirements(null);
  assert.equal(empty.isPreset, false);
  assert.equal(empty.min, '');
  assert.equal(empty.max, '');
});

test('getJobEligibilityDetails includes experience_requirements and supports independent fields', () => {
  // Job with only experience specified (e.g. 3+ years, no batch restriction)
  const expOnlyJob = {
    experience_requirements: '3+ Years',
  };
  const expDetails = getJobEligibilityDetails(expOnlyJob);
  assert.equal(expDetails.experienceRequirements, '3+ Years');
  assert.equal(expDetails.experienceRequirementsText, '3+ Years');
  assert.equal(expDetails.isExperienceSpecified, true);
  assert.equal(expDetails.batchesText, 'Not Specified');
  assert.equal(expDetails.candidateTypeText, 'Not Specified');
  assert.equal(expDetails.qualificationsText, 'Not Specified');
  assert.equal(expDetails.hasAnyEligibility, true);

  // Job with all 4 eligibility fields
  const fullJob = {
    eligible_batches: ['2027'],
    candidate_type: 'Freshers Only',
    experience_requirements: 'Fresher (0 Years)',
    eligible_qualifications: ['B.Tech'],
  };
  const fullDetails = getJobEligibilityDetails(fullJob);
  assert.equal(fullDetails.batchesText, '2027');
  assert.equal(fullDetails.candidateTypeText, 'Freshers Only');
  assert.equal(fullDetails.experienceRequirementsText, 'Fresher (0 Years)');
  assert.equal(fullDetails.qualificationsText, 'B.Tech');
  assert.equal(fullDetails.hasAnyEligibility, true);
});
