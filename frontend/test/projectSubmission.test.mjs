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
