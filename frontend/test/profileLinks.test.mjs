import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeProfileUrl,
  getSafeExternalUrl,
  isValidProfileUrl,
  cleanSocialProfileUrl,
} from '../src/utils/profileLinks.js';

test('provider home pages are not treated as user profile links', () => {
  assert.equal(cleanSocialProfileUrl('https://github.com', 'github'), '');
  assert.equal(cleanSocialProfileUrl('github.com/', 'github'), '');
  assert.equal(cleanSocialProfileUrl('https://linkedin.com', 'linkedin'), '');
  assert.equal(cleanSocialProfileUrl('https://www.linkedin.com/', 'linkedin'), '');
});

test('normalizeProfileUrl supports all LinkedIn formats', () => {
  assert.equal(
    normalizeProfileUrl('https://www.linkedin.com/in/username', 'linkedin'),
    'https://www.linkedin.com/in/username'
  );
  assert.equal(
    normalizeProfileUrl('http://linkedin.com/in/username', 'linkedin'),
    'http://linkedin.com/in/username'
  );
  assert.equal(
    normalizeProfileUrl('[www.linkedin.com/in/username](http://www.linkedin.com/in/username)', 'linkedin'),
    'http://www.linkedin.com/in/username'
  );
  assert.equal(
    normalizeProfileUrl('www.linkedin.com/in/username', 'linkedin'),
    'https://www.linkedin.com/in/username'
  );
  assert.equal(
    normalizeProfileUrl('linkedin.com/in/username', 'linkedin'),
    'https://linkedin.com/in/username'
  );
});

test('normalizeProfileUrl supports all GitHub formats', () => {
  assert.equal(
    normalizeProfileUrl('https://github.com/username', 'github'),
    'https://github.com/username'
  );
  assert.equal(
    normalizeProfileUrl('http://github.com/username', 'github'),
    'http://github.com/username'
  );
  assert.equal(
    normalizeProfileUrl('[www.github.com/username](http://www.github.com/username)', 'github'),
    'http://www.github.com/username'
  );
  assert.equal(
    normalizeProfileUrl('www.github.com/username', 'github'),
    'https://www.github.com/username'
  );
  assert.equal(
    normalizeProfileUrl('github.com/username', 'github'),
    'https://github.com/username'
  );
});

test('normalizeProfileUrl supports all Personal Website formats', () => {
  assert.equal(
    normalizeProfileUrl('https://example.com'),
    'https://example.com'
  );
  assert.equal(
    normalizeProfileUrl('http://example.com'),
    'http://example.com'
  );
  assert.equal(
    normalizeProfileUrl('[www.example.com](http://www.example.com)'),
    'http://www.example.com'
  );
  assert.equal(
    normalizeProfileUrl('www.example.com'),
    'https://www.example.com'
  );
  assert.equal(
    normalizeProfileUrl('example.com'),
    'https://example.com'
  );
});

test('normalizeProfileUrl blocks dangerous and malformed URLs', () => {
  assert.equal(normalizeProfileUrl('javascript:alert(1)'), null);
  assert.equal(normalizeProfileUrl('data:text/html,<script>alert(1)</script>'), null);
  assert.equal(normalizeProfileUrl('vbscript:msgbox'), null);
  assert.equal(normalizeProfileUrl('file:///etc/passwd'), null);
  assert.equal(normalizeProfileUrl('not_a_valid_url'), null);
  assert.equal(normalizeProfileUrl(''), null);
  assert.equal(normalizeProfileUrl('   '), null);
  assert.equal(normalizeProfileUrl(null), null);
  assert.equal(normalizeProfileUrl(undefined), null);
});

test('getSafeExternalUrl always returns absolute external URL', () => {
  const safe = getSafeExternalUrl('linkedin.com/in/student', 'linkedin');
  assert.equal(safe, 'https://linkedin.com/in/student');
  assert.ok(safe.startsWith('https://'), 'Must be absolute URL to avoid relative React Router navigation');
});

test('isValidProfileUrl correctly validates URLs', () => {
  assert.equal(isValidProfileUrl('linkedin.com/in/student', 'linkedin'), true);
  assert.equal(isValidProfileUrl(''), true);
  assert.equal(isValidProfileUrl('   '), true);
  assert.equal(isValidProfileUrl('javascript:alert(1)'), false);
  assert.equal(isValidProfileUrl('not_a_url'), false);
});
