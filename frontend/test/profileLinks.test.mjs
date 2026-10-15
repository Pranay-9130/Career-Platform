import test from 'node:test';
import assert from 'node:assert/strict';

import { cleanSocialProfileUrl } from '../src/utils/profileLinks.js';

test('provider home pages are not treated as user profile links', () => {
  assert.equal(cleanSocialProfileUrl('https://github.com', 'github'), '');
  assert.equal(cleanSocialProfileUrl('github.com/', 'github'), '');
  assert.equal(cleanSocialProfileUrl('https://linkedin.com', 'linkedin'), '');
  assert.equal(cleanSocialProfileUrl('https://www.linkedin.com/', 'linkedin'), '');
});

test('real user profile links are preserved', () => {
  assert.equal(cleanSocialProfileUrl('https://github.com/pranay', 'github'), 'https://github.com/pranay');
  assert.equal(
    cleanSocialProfileUrl('linkedin.com/in/pranay', 'linkedin'),
    'linkedin.com/in/pranay',
  );
});
