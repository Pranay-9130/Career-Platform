import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hasMinimumProjectScreenshots,
  MINIMUM_PROJECT_SCREENSHOTS,
  shouldReplaceCoverWithScreenshot,
} from '../src/utils/projectSubmission.js';

test('project screenshots meet the required minimum of three', () => {
  assert.equal(MINIMUM_PROJECT_SCREENSHOTS, 3);
  assert.equal(hasMinimumProjectScreenshots([]), false);
  assert.equal(hasMinimumProjectScreenshots([{ image_url: 'one' }, { image_url: 'two' }]), false);
  assert.equal(
    hasMinimumProjectScreenshots([{ image_url: 'one' }, { image_url: 'two' }, { image_url: 'three' }]),
    true,
  );
  assert.equal(
    hasMinimumProjectScreenshots(Array.from({ length: 5 }, (_, index) => ({ image_url: `${index}` }))),
    true,
  );
  assert.equal(
    hasMinimumProjectScreenshots(Array.from({ length: 8 }, (_, index) => ({ image_url: `${index}` }))),
    true,
  );
});

test('uploaded screenshots replace preset covers without overwriting custom or legacy covers', () => {
  const presetCoverUrls = new Set(['https://example.com/preset.jpg']);
  assert.equal(shouldReplaceCoverWithScreenshot('', presetCoverUrls), true);
  assert.equal(shouldReplaceCoverWithScreenshot('https://example.com/preset.jpg', presetCoverUrls), true);
  assert.equal(shouldReplaceCoverWithScreenshot('https://example.com/custom.jpg', presetCoverUrls), false);
  assert.equal(shouldReplaceCoverWithScreenshot('legacy-cover-key', presetCoverUrls), false);
});

test('project cover image validation requires a valid cover image and minimum screenshots', () => {
  const isStep4Valid = (coverUrl, screenshots) =>
    Boolean(coverUrl && coverUrl.trim().length > 0) &&
    hasMinimumProjectScreenshots(screenshots);

  const sampleScreenshots = [{ image_url: 's1' }, { image_url: 's2' }, { image_url: 's3' }];

  // Without cover image, step 4 is invalid even with enough screenshots
  assert.equal(isStep4Valid('', sampleScreenshots), false);
  assert.equal(isStep4Valid('   ', sampleScreenshots), false);
  assert.equal(isStep4Valid(null, sampleScreenshots), false);

  // With custom uploaded cover image and screenshots, step 4 is valid
  assert.equal(isStep4Valid('https://storage.example.com/cover.png', sampleScreenshots), true);

  // With custom cover image but insufficient screenshots, step 4 is invalid
  assert.equal(isStep4Valid('https://storage.example.com/cover.png', [{ image_url: 's1' }]), false);
});

test('validateFeatureInput prevents empty and duplicate features', async () => {
  const { validateFeatureInput } = await import('../src/utils/projectSubmission.js');

  // Empty or whitespace inputs are rejected
  assert.equal(validateFeatureInput('').isValid, false);
  assert.equal(validateFeatureInput('   ').isValid, false);
  assert.equal(validateFeatureInput(null).isValid, false);

  // Duplicates are rejected case-insensitively
  const existing = ['JWT authentication', 'Role-based access control'];
  assert.equal(validateFeatureInput('JWT authentication', existing).isValid, false);
  assert.equal(validateFeatureInput('jwt authentication', existing).isValid, false);
  assert.equal(validateFeatureInput('  Role-Based Access Control  ', existing).isValid, false);

  // Valid unique features are accepted and trimmed
  const result = validateFeatureInput('  OAuth2 social login  ', existing);
  assert.equal(result.isValid, true);
  assert.equal(result.feature, 'OAuth2 social login');
  assert.equal(result.error, null);
});

test('isStep1BasicInfoValid accepts descriptions of 0, 50, 100, and 299 words without length restriction', async () => {
  const { isStep1BasicInfoValid } = await import('../src/utils/projectSubmission.js');

  const generateWords = (count) => Array.from({ length: count }, (_, i) => `word${i + 1}`).join(' ');

  // Valid with 0 words (empty or omitted description)
  assert.equal(isStep1BasicInfoValid({ title: 'My Awesome Project', domain: 'Web Development', short_description: '' }), true);
  assert.equal(isStep1BasicInfoValid({ title: 'My Awesome Project', domain: 'Web Development' }), true);

  // Valid with 50 words
  assert.equal(isStep1BasicInfoValid({ title: 'My Awesome Project', domain: 'Web Development', short_description: generateWords(50) }), true);

  // Valid with 100 words
  assert.equal(isStep1BasicInfoValid({ title: 'My Awesome Project', domain: 'Web Development', short_description: generateWords(100) }), true);

  // Valid with 299 words
  assert.equal(isStep1BasicInfoValid({ title: 'My Awesome Project', domain: 'Web Development', short_description: generateWords(299) }), true);

  // Invalid when title is shorter than 3 characters or domain is missing
  assert.equal(isStep1BasicInfoValid({ title: 'AB', domain: 'Web Development' }), false);
  assert.equal(isStep1BasicInfoValid({ title: 'My Awesome Project', domain: '' }), false);
});

test('isStep2ProblemAndFeaturesValid requires at least one feature', async () => {
  const { isStep2ProblemAndFeaturesValid } = await import('../src/utils/projectSubmission.js');

  const validProblem = 'Detailed explanation of the real-world problem and technical pain point.';

  // Invalid without features
  assert.equal(isStep2ProblemAndFeaturesValid({ problem_statement: validProblem, features: [] }), false);

  // Valid with 1 or more features
  assert.equal(isStep2ProblemAndFeaturesValid({ problem_statement: validProblem, features: ['JWT Authentication'] }), true);
  assert.equal(isStep2ProblemAndFeaturesValid({ problem_statement: validProblem, features: ['Feat 1', 'Feat 2'] }), true);

  // Invalid with short problem statement
  assert.equal(isStep2ProblemAndFeaturesValid({ problem_statement: 'Short', features: ['JWT Authentication'] }), false);
});

test('Step 2 Next Step button disabled and click state logic', async () => {
  const isStep2NextDisabled = ({ features, featureInput, isStep2Valid }) => {
    // If user has typed in featureInput, leave button clickable to trigger inline guidance
    if ((featureInput || '').trim()) return false;
    return !isStep2Valid;
  };

  // 1. Initial Step 2 state: no features added, input empty -> Next Step is disabled
  assert.equal(isStep2NextDisabled({ features: [], featureInput: '', isStep2Valid: false }), true);

  // 2. User has typed in input, but hasn't clicked Add Feature -> Next Step is clickable (not disabled)
  // so clicking it displays the inline message explaining that Add Feature must be clicked first
  assert.equal(isStep2NextDisabled({ features: [], featureInput: 'JWT auth', isStep2Valid: false }), false);

  // 3. User adds the feature: features has 1 item, input is cleared, isStep2Valid is true -> Next Step is enabled
  assert.equal(isStep2NextDisabled({ features: ['JWT auth'], featureInput: '', isStep2Valid: true }), false);

  // 4. User adds 1 feature, then types in another feature without clicking Add Feature -> clickable to prevent losing text
  assert.equal(isStep2NextDisabled({ features: ['JWT auth'], featureInput: 'RBAC', isStep2Valid: true }), false);
});


