import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('PublicNavbar registers College Survival Kit in feature dropdown with NEW badge', () => {
  const navbarSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'components', 'navbar', 'PublicNavbar.jsx'),
    'utf-8'
  );

  assert.match(navbarSource, /name:\s*['"]College Survival Kit['"]/, 'Navbar must declare College Survival Kit');
  assert.match(navbarSource, /path:\s*['"]\/features\/college-survival-kit['"]/, 'Navbar must route to /features/college-survival-kit');
  assert.match(navbarSource, /description:\s*['"]Essential tools for everyday college life\.['"]/, 'Navbar must have required description');
  assert.match(navbarSource, /badge:\s*['"]NEW['"]/, 'Navbar must have NEW badge');
  assert.match(navbarSource, /location\.pathname\.startsWith\(['"]\/college-survival-kit['"]\)/, 'Navbar must mark features active for /college-survival-kit');
});

test('App.jsx registers College Survival Kit preview and interactive calculator routes', () => {
  const appSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'App.jsx'),
    'utf-8'
  );

  assert.match(appSource, /PublicCollegeSurvivalKitPage/, 'App.jsx must declare PublicCollegeSurvivalKitPage');
  assert.match(appSource, /CollegeSurvivalKitPage/, 'App.jsx must declare CollegeSurvivalKitPage');

  assert.match(appSource, /path="\/features\/college-survival-kit"/, 'App.jsx must register /features/college-survival-kit');
  assert.match(appSource, /path="\/college-survival-kit"/, 'App.jsx must register /college-survival-kit');
  assert.match(appSource, /path="\/college-survival-kit\/:toolId"/, 'App.jsx must register /college-survival-kit/:toolId');
});

test('StudentLayout registers College Survival Kit under Career Tools in sidebar', () => {
  const layoutSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'layouts', 'StudentLayout', 'index.jsx'),
    'utf-8'
  );

  assert.match(layoutSource, /name:\s*['"]College Survival Kit['"]/, 'Student sidebar must include College Survival Kit');
  assert.match(layoutSource, /path:\s*['"]\/college-survival-kit['"]/, 'Student sidebar must link to /college-survival-kit');
});

test('HomePage registers dedicated College Survival Kit showcase with 5 calculators', () => {
  const homeSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'pages', 'public', 'HomePage.jsx'),
    'utf-8'
  );

  assert.match(homeSource, /College Survival Kit/, 'HomePage must have College Survival Kit section');
  assert.match(homeSource, /Your college life, simplified\./, 'HomePage must contain required tagline');
  assert.match(homeSource, /Explore College Survival Kit/, 'HomePage must have Explore button');
  assert.match(homeSource, /\/college-survival-kit\/attendance/, 'HomePage must link to attendance calculator');
  assert.match(homeSource, /\/college-survival-kit\/cgpa/, 'HomePage must link to cgpa calculator');
  assert.match(homeSource, /\/college-survival-kit\/placement-eligibility/, 'HomePage must link to placement eligibility checker');
  assert.match(homeSource, /\/college-survival-kit\/salary/, 'HomePage must link to salary calculator');
  assert.match(homeSource, /\/college-survival-kit\/marks/, 'HomePage must link to marks calculator');
});

test('DashboardPage registers dedicated College Survival Kit widget with 5 calculators', () => {
  const dashboardSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'pages', 'student', 'DashboardPage.jsx'),
    'utf-8'
  );

  assert.match(dashboardSource, /College Survival Kit/, 'Dashboard must have College Survival Kit widget');
  assert.match(dashboardSource, /Your everyday college tools, all in one place\./, 'Dashboard must have required subtitle');
  assert.match(dashboardSource, /View All Tools/, 'Dashboard must have View All Tools button');
  assert.match(dashboardSource, /\/college-survival-kit\/attendance/, 'Dashboard must link to attendance calculator');
  assert.match(dashboardSource, /\/college-survival-kit\/cgpa/, 'Dashboard must link to cgpa calculator');
  assert.match(dashboardSource, /\/college-survival-kit\/placement-eligibility/, 'Dashboard must link to placement eligibility checker');
  assert.match(dashboardSource, /\/college-survival-kit\/salary/, 'Dashboard must link to salary calculator');
  assert.match(dashboardSource, /\/college-survival-kit\/marks/, 'Dashboard must link to marks calculator');
});

test('All 5 calculator components exist and export default functions', () => {
  const kitDir = path.join(projectRoot, 'src', 'components', 'survivalKit');
  const calculators = [
    'AttendanceCalculator.jsx',
    'CgpaCalculator.jsx',
    'PlacementEligibilityChecker.jsx',
    'SalaryCalculator.jsx',
    'MarksCalculator.jsx',
  ];

  for (const calc of calculators) {
    const fullPath = path.join(kitDir, calc);
    assert.ok(fs.existsSync(fullPath), `Calculator component ${calc} must exist in ${kitDir}`);
    const content = fs.readFileSync(fullPath, 'utf-8');
    assert.match(content, /export default function/, `${calc} must export default function`);
  }
});

test('Both College Survival Kit pages exist and export default functions', () => {
  const hubPath = path.join(projectRoot, 'src', 'pages', 'public', 'CollegeSurvivalKitPage.jsx');
  const previewPath = path.join(projectRoot, 'src', 'pages', 'public', 'features', 'PublicCollegeSurvivalKitPage.jsx');

  assert.ok(fs.existsSync(hubPath), 'CollegeSurvivalKitPage.jsx must exist');
  assert.ok(fs.existsSync(previewPath), 'PublicCollegeSurvivalKitPage.jsx must exist');

  assert.match(fs.readFileSync(hubPath, 'utf-8'), /export default function/, 'CollegeSurvivalKitPage must export default function');
  assert.match(fs.readFileSync(previewPath, 'utf-8'), /export default function/, 'PublicCollegeSurvivalKitPage must export default function');
});
