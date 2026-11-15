import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('PublicNavbar places Download App between Contact and Log in', () => {
  const navbarFile = path.resolve('src/components/navbar/PublicNavbar.jsx');
  assert.ok(fs.existsSync(navbarFile), 'PublicNavbar.jsx must exist');

  const content = fs.readFileSync(navbarFile, 'utf8');
  assert.match(content, /Download App/, 'Navbar must include Download App link text');
  assert.match(content, /\/download-app/, 'Navbar must link to /download-app');

  const contactIdx = content.indexOf("name: 'Contact'");
  const downloadIdx = content.indexOf("name: 'Download App'");

  assert.ok(contactIdx !== -1, 'Contact link must exist in navbar');
  assert.ok(downloadIdx !== -1, 'Download App link must exist in navbar');
  assert.ok(downloadIdx > contactIdx, 'Download App must be positioned after Contact');
});

test('App.jsx registers /download-app and /download redirect routes', () => {
  const appFile = path.resolve('src/App.jsx');
  const content = fs.readFileSync(appFile, 'utf8');

  assert.match(content, /path="\/download-app"/, 'Must register /download-app route');
  assert.match(content, /path="\/download"/, 'Must register /download alias route');
  assert.match(content, /DownloadAppPage/, 'Must render DownloadAppPage component');
});

test('PublicFooter includes Download Android App link', () => {
  const footerFile = path.resolve('src/components/footer/PublicFooter.jsx');
  const content = fs.readFileSync(footerFile, 'utf8');

  assert.match(content, /Download Android App/, 'Footer must link to Android app download');
  assert.match(content, /to="\/download-app"/, 'Footer must point to /download-app');
});

test('Backend download routes declare APK and app-info endpoints', () => {
  const downloadRouteFile = path.resolve('../backend/app/api/routes/download.py');
  assert.ok(fs.existsSync(downloadRouteFile), 'backend download.py route must exist');

  const content = fs.readFileSync(downloadRouteFile, 'utf8');
  assert.match(content, /\/android-apk/, 'Must define /android-apk endpoint');
  assert.match(content, /\/app-info/, 'Must define /app-info endpoint');
  assert.match(content, /application\/vnd\.android\.package-archive/, 'Must serve APK MIME type');
});

test('Android application directory structure contains core files and navigation tabs', () => {
  const androidRoot = path.resolve('../android');
  assert.ok(fs.existsSync(androidRoot), 'android/ directory must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'package.json')), 'android/package.json must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'app.json')), 'android/app.json must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'app/(tabs)/index.tsx')), 'Home tab screen must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'app/(tabs)/jobs.tsx')), 'Jobs tab screen must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'app/(tabs)/projects.tsx')), 'Projects tab screen must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'app/(tabs)/applications.tsx')), 'Applications tab screen must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'app/(tabs)/profile.tsx')), 'Profile tab screen must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'app/tools/resume-builder.tsx')), 'Resume builder screen must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'app/tools/ats-analyzer.tsx')), 'ATS analyzer screen must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'app/tools/skill-intelligence.tsx')), 'Skill intelligence screen must exist');
  assert.ok(fs.existsSync(path.join(androidRoot, 'app/tools/placement-prep.tsx')), 'Placement prep screen must exist');
});
