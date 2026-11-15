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

test('Valid release APK is hosted in frontend/public/downloads/ and backend/downloads/', () => {
  const frontendApk = path.resolve('public/downloads/AspirePath-v1.0.0.apk');
  assert.ok(fs.existsSync(frontendApk), 'frontend/public/downloads/AspirePath-v1.0.0.apk must exist');
  const frontendStat = fs.statSync(frontendApk);
  assert.ok(frontendStat.size > 100000, 'Frontend APK must be substantial non-empty file (>100KB)');

  const backendApk = path.resolve('../backend/downloads/AspirePath-v1.0.0.apk');
  assert.ok(fs.existsSync(backendApk), 'backend/downloads/AspirePath-v1.0.0.apk must exist');
  const backendStat = fs.statSync(backendApk);
  assert.ok(backendStat.size > 100000, 'Backend APK must be substantial non-empty file (>100KB)');

  // Verify ZIP header magic bytes: PK (0x50 0x4B 0x03 0x04)
  const fd = fs.openSync(frontendApk, 'r');
  const buffer = Buffer.alloc(4);
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);
  assert.equal(buffer[0], 0x50, 'Must have zip header byte 0 (P)');
  assert.equal(buffer[1], 0x4b, 'Must have zip header byte 1 (K)');
});

test('frontend/vercel.json configures APK content-type and attachment headers', () => {
  const vercelFile = path.resolve('vercel.json');
  assert.ok(fs.existsSync(vercelFile), 'vercel.json must exist');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelFile, 'utf8'));

  const apkHeader = vercelConfig.headers?.find((h) => h.source && h.source.includes('/downloads/'));
  assert.ok(apkHeader, 'vercel.json must configure headers for /downloads/');

  const ct = apkHeader.headers.find((header) => header.key === 'Content-Type');
  assert.equal(ct?.value, 'application/vnd.android.package-archive');

  const cd = apkHeader.headers.find((header) => header.key === 'Content-Disposition');
  assert.match(cd?.value || '', /attachment; filename="AspirePath-v1\.0\.0\.apk"/);
});

test('DownloadAppPage.jsx implements stateful download and troubleshooting guidance', () => {
  const pageFile = path.resolve('src/pages/public/DownloadAppPage.jsx');
  const content = fs.readFileSync(pageFile, 'utf8');

  assert.match(content, /downloadState/, 'Must manage downloadState');
  assert.match(content, /handleDownload/, 'Must provide handleDownload handler');
  assert.match(content, /AspirePath-v1\.0\.0\.apk/, 'Must reference official APK package name');
  assert.match(content, /Download Started|Download started|Download Initiated/, 'Must inform user when download is initiated');
  assert.match(content, /Install unknown apps|File might be harmful/, 'Must provide Android troubleshooting tips');
});

test('.gitignore explicitly un-ignores release APK packages so Vercel can bundle them', () => {
  const gitignoreFile = path.resolve('../.gitignore');
  assert.ok(fs.existsSync(gitignoreFile), '.gitignore must exist');
  const content = fs.readFileSync(gitignoreFile, 'utf8');

  assert.match(content, /!frontend\/public\/downloads\//, 'Must un-ignore frontend/public/downloads/');
  assert.match(content, /!backend\/downloads\//, 'Must un-ignore backend/downloads/');
});



