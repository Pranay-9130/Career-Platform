import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');

test('PublicNavbar keeps clean navigation without /download-app clutter', () => {
  const navbarFile = path.join(frontendRoot, 'src', 'components', 'navbar', 'PublicNavbar.jsx');
  assert.ok(fs.existsSync(navbarFile), 'PublicNavbar.jsx must exist');
  const navContent = fs.readFileSync(navbarFile, 'utf8');
  assert.doesNotMatch(navContent, /\/download-app/, 'Navbar must not clutter with /download-app link');
});

test('App.jsx registers /download-app and /download redirect routes', () => {
  const appFile = path.join(frontendRoot, 'src', 'App.jsx');
  const content = fs.readFileSync(appFile, 'utf8');

  assert.match(content, /path="\/download-app"/, 'Must register /download-app route');
  assert.match(content, /path="\/download"/, 'Must register /download alias route');
  assert.match(content, /DownloadAppPage/, 'Must render DownloadAppPage component');
});

test('Backend download routes declare APK and app-info endpoints', () => {
  const downloadRouteFile = path.join(repoRoot, 'backend', 'app', 'api', 'routes', 'download.py');
  assert.ok(fs.existsSync(downloadRouteFile), 'backend download.py route must exist');

  const content = fs.readFileSync(downloadRouteFile, 'utf8');
  assert.match(content, /\/android-apk/, 'Must define /android-apk endpoint');
  assert.match(content, /\/app-info/, 'Must define /app-info endpoint');
  assert.match(content, /application\/vnd\.android\.package-archive/, 'Must serve APK MIME type');
});

test('Android application directory structure contains core files and navigation tabs', () => {
  const androidRoot = path.join(repoRoot, 'android');
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

test('Valid release APK is hosted in frontend/public/downloads/ and backend/downloads/', () => {
  const frontendApk = path.join(frontendRoot, 'public', 'downloads', 'AspirePath-v1.0.0.apk');
  assert.ok(fs.existsSync(frontendApk), 'frontend/public/downloads/AspirePath-v1.0.0.apk must exist');
  const backendApk = path.join(repoRoot, 'backend', 'downloads', 'AspirePath-v1.0.0.apk');
  assert.ok(fs.existsSync(backendApk), 'backend/downloads/AspirePath-v1.0.0.apk must exist');

  const frontendStat = fs.statSync(frontendApk);
  const backendStat = fs.statSync(backendApk);

  assert.ok(frontendStat.size > 20 * 1024 * 1024, 'Frontend APK must be a complete binary (>20MB)');
  assert.ok(backendStat.size > 20 * 1024 * 1024, 'Backend APK must be a complete binary (>20MB)');
  assert.equal(frontendStat.size, backendStat.size, 'Frontend and backend APK binaries must match byte size');
});

test('frontend/vercel.json configures APK content-type and attachment headers', () => {
  const vercelFile = path.join(frontendRoot, 'vercel.json');
  assert.ok(fs.existsSync(vercelFile), 'vercel.json must exist');

  const content = JSON.parse(fs.readFileSync(vercelFile, 'utf8'));
  const apkHeaderRule = content.headers?.find((rule) =>
    rule.source && rule.source.includes('.apk')
  );

  assert.ok(apkHeaderRule, 'vercel.json must define headers for APK downloads');
  const headers = Object.fromEntries(apkHeaderRule.headers.map((h) => [h.key, h.value]));
  assert.equal(headers['Content-Type'], 'application/vnd.android.package-archive');
  assert.match(headers['Content-Disposition'], /attachment;\s*filename="AspirePath-v1\.0\.0\.apk"/);
});

test('DownloadAppPage.jsx implements stateful download and troubleshooting guidance', () => {
  const pageFile = path.join(frontendRoot, 'src', 'pages', 'public', 'DownloadAppPage.jsx');
  const content = fs.readFileSync(pageFile, 'utf8');

  assert.match(content, /handleDownload/, 'Must trigger download handler');
  assert.match(content, /downloadState/, 'Must reflect downloading state');
  assert.match(content, /Installation/, 'Must include installation instructions');
});

test('.gitignore explicitly un-ignores release APK packages so Vercel can bundle them', () => {
  const gitignoreFile = path.join(repoRoot, '.gitignore');
  assert.ok(fs.existsSync(gitignoreFile), '.gitignore must exist');

  const content = fs.readFileSync(gitignoreFile, 'utf8');
  assert.match(content, /!frontend\/public\/downloads\/\*\.apk/, 'Must un-ignore frontend APKs');
  assert.match(content, /!backend\/downloads\/\*\.apk/, 'Must un-ignore backend APKs');
});
