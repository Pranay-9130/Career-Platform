import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('PublicNavbar registers Features mega-menu with core career tools including Placement Preparation', () => {
  const navbarSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'components', 'navbar', 'PublicNavbar.jsx'),
    'utf-8'
  );

  assert.match(navbarSource, /ATS Resume Analyzer/, 'Navbar must include ATS Resume Analyzer');
  assert.match(navbarSource, /Skill Intelligence/, 'Navbar must include Skill Intelligence');
  assert.match(navbarSource, /Placement Preparation/, 'Navbar must include Placement Preparation');
  assert.match(navbarSource, /College Survival Kit/, 'Navbar must include College Survival Kit');

  assert.match(navbarSource, /\/templates/, 'Navbar must route to /templates');
  assert.match(navbarSource, /\/features\/ats-analyzer/, 'Navbar must route to /features/ats-analyzer');
  assert.match(navbarSource, /\/features\/skill-intelligence/, 'Navbar must route to /features/skill-intelligence');
  assert.match(navbarSource, /\/features\/placement-preparation/, 'Navbar must route to /features/placement-preparation');
  assert.match(navbarSource, /\/features\/college-survival-kit/, 'Navbar must route to /features/college-survival-kit');

  // Verify Logo import and fallback handling
  assert.match(navbarSource, /srcSet="\/logo\.webp"/, 'Navbar must prefer the compact official logo');
  assert.match(navbarSource, /src="\/logo\.png"/, 'Navbar must retain a PNG fallback');
  assert.match(navbarSource, /onError=/, 'Navbar logo must declare onError fallback handler');

  // Verify Android APK/download is strictly excluded from main website navbar
  assert.doesNotMatch(navbarSource, /\/download-app/, 'Navbar must not contain /download-app link');
  assert.doesNotMatch(navbarSource, /isDownloadApp/, 'Navbar must not contain isDownloadApp flag');
});

test('App.jsx registers public feature routes and placement preparation routes', () => {
  const appSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'App.jsx'),
    'utf-8'
  );

  assert.match(appSource, /PublicAtsAnalyzerPage/, 'App.jsx must declare PublicAtsAnalyzerPage');
  assert.match(appSource, /PublicSkillIntelligencePage/, 'App.jsx must declare PublicSkillIntelligencePage');
  assert.match(appSource, /PublicPlacementPrepPage/, 'App.jsx must declare PublicPlacementPrepPage');

  assert.match(appSource, /path="\/features\/ats-analyzer"/, 'App.jsx must register /features/ats-analyzer route');
  assert.match(appSource, /path="\/features\/skill-intelligence"/, 'App.jsx must register /features/skill-intelligence route');
  assert.match(appSource, /path="\/features\/resume-builder"/, 'App.jsx must register /features/resume-builder route');
  assert.match(appSource, /path="\/features\/placement-preparation"/, 'App.jsx must register /features/placement-preparation route');
  assert.match(appSource, /path="\/placement-preparation"/, 'App.jsx must register /placement-preparation route');
});

test('All 4 public feature preview page component files exist and export React components', () => {
  const pagesDir = path.join(projectRoot, 'src', 'pages', 'public', 'features');

  const files = [
    'PublicAtsAnalyzerPage.jsx',
    'PublicSkillIntelligencePage.jsx',
    'PublicResumeBuilderPage.jsx',
    'PublicPlacementPrepPage.jsx',
  ];

  for (const file of files) {
    const fullPath = path.join(pagesDir, file);
    assert.ok(fs.existsSync(fullPath), `File ${file} must exist in ${pagesDir}`);
    const content = fs.readFileSync(fullPath, 'utf-8');
    assert.match(content, /export default function/, `${file} must export a default React component`);
  }
});

test('PublicFooter links Platform column to the core features including Placement Preparation', () => {
  const footerSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'components', 'footer', 'PublicFooter.jsx'),
    'utf-8'
  );

  assert.match(footerSource, /to="\/features\/ats-analyzer"/, 'Footer must link to /features/ats-analyzer');
  assert.match(footerSource, /to="\/features\/skill-intelligence"/, 'Footer must link to /features/skill-intelligence');
  assert.match(footerSource, /to="\/features\/placement-preparation"/, 'Footer must link to /features/placement-preparation');
  assert.match(footerSource, /to="\/templates"/, 'Footer must link to /templates');
  assert.doesNotMatch(footerSource, /\/download-app/, 'Footer must not contain /download-app link');
});
