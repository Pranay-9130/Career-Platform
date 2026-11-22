import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('TermsPage and PrivacyPage components exist and are created', () => {
  const termsExists = fs.existsSync(path.join(projectRoot, 'src', 'pages', 'public', 'TermsPage.jsx'));
  const privacyExists = fs.existsSync(path.join(projectRoot, 'src', 'pages', 'public', 'PrivacyPage.jsx'));

  assert.ok(termsExists, 'TermsPage.jsx must exist in pages/public');
  assert.ok(privacyExists, 'PrivacyPage.jsx must exist in pages/public');
});

test('App.jsx registers /terms and /privacy routes with redirects', () => {
  const appSrc = fs.readFileSync(path.join(projectRoot, 'src', 'App.jsx'), 'utf-8');

  assert.match(appSrc, /TermsPage/, 'App.jsx must declare TermsPage');
  assert.match(appSrc, /PrivacyPage/, 'App.jsx must declare PrivacyPage');
  assert.match(appSrc, /path="\/terms"/, 'App.jsx must register /terms route');
  assert.match(appSrc, /path="\/privacy"/, 'App.jsx must register /privacy route');
  assert.match(appSrc, /path="\/terms-and-conditions"/, 'App.jsx must register /terms-and-conditions alias');
  assert.match(appSrc, /path="\/privacy-policy"/, 'App.jsx must register /privacy-policy alias');
});

test('PublicFooter.jsx contains clickable Links to Privacy Policy and Terms of Service', () => {
  const footerSrc = fs.readFileSync(
    path.join(projectRoot, 'src', 'components', 'footer', 'PublicFooter.jsx'),
    'utf-8'
  );

  assert.match(footerSrc, /to="\/privacy"/, 'Footer must link to /privacy');
  assert.match(footerSrc, /to="\/terms"/, 'Footer must link to /terms');
  assert.doesNotMatch(footerSrc, /Privacy Policy<\/span>/, 'Privacy Policy must not be an unclickable span');
  assert.doesNotMatch(footerSrc, /Terms of Service<\/span>/, 'Terms of Service must not be an unclickable span');
});

test('RegisterPage.jsx links to /terms and /privacy in new tab', () => {
  const regSrc = fs.readFileSync(path.join(projectRoot, 'src', 'pages', 'auth', 'RegisterPage.jsx'), 'utf-8');

  assert.match(regSrc, /to="\/terms"/, 'RegisterPage must link to /terms');
  assert.match(regSrc, /to="\/privacy"/, 'RegisterPage must link to /privacy');
  assert.match(regSrc, /target="_blank"/, 'RegisterPage legal links must open in a new tab');
  assert.match(regSrc, /rel="noopener noreferrer"/, 'RegisterPage legal links must declare rel="noopener noreferrer"');
});
