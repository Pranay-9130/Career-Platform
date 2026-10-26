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

