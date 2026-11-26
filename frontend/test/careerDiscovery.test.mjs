import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('careerDiscoveryService defines all API integration methods', () => {
  const serviceSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'services', 'careerDiscoveryService.js'),
    'utf-8'
  );

  assert.match(serviceSource, /getStatus/, 'Service must define getStatus');
  assert.match(serviceSource, /saveProgress/, 'Service must define saveProgress');
  assert.match(serviceSource, /generateAssessment/, 'Service must define generateAssessment');
  assert.match(serviceSource, /submitAssessment/, 'Service must define submitAssessment');
  assert.match(serviceSource, /updateRoadmapStage/, 'Service must define updateRoadmapStage');
  assert.match(serviceSource, /resetDiscovery/, 'Service must define resetDiscovery');
  assert.match(serviceSource, /getSummary/, 'Service must define getSummary');
});

test('App.jsx registers Career Discovery page and routes', () => {
  const appSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'App.jsx'),
    'utf-8'
  );

  assert.match(appSource, /CareerDiscoveryPage/, 'App.jsx must import CareerDiscoveryPage');
  assert.match(appSource, /path="\/career-discovery"/, 'App.jsx must register /career-discovery route');
  assert.match(appSource, /path="\/features\/career-discovery"/, 'App.jsx must register /features/career-discovery route');
});

test('StudentLayout places Career Discovery under Career Tools and Resume Templates under Explore Platform', () => {
  const layoutSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'layouts', 'StudentLayout', 'index.jsx'),
    'utf-8'
  );

  assert.match(layoutSource, /name:\s*'Career Discovery'/, 'Sidebar must include Career Discovery');
  assert.match(layoutSource, /path:\s*'\/career-discovery'/, 'Sidebar must link to /career-discovery');

  // Verify Resume Templates is under Explore Platform
  assert.match(layoutSource, /title:\s*'Explore Platform'[\s\S]*name:\s*'Resume Templates'/, 'Resume Templates must be under Explore Platform');
});

test('DashboardPage includes Career Discovery in quick actions and welcome card without Resume Templates duplication', () => {
  const dashboardSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'pages', 'student', 'DashboardPage.jsx'),
    'utf-8'
  );

  assert.match(dashboardSource, /careerDiscoveryService/, 'DashboardPage must use careerDiscoveryService');
  assert.match(dashboardSource, /to="\/career-discovery"/, 'DashboardPage must link to /career-discovery');
  assert.match(dashboardSource, /Your Career Journey Starts Here!/, 'DashboardPage must include welcome banner');
  assert.match(dashboardSource, /Discover My Career Path/, 'DashboardPage must include discovery CTA');

  // Verify quick actions bar has Career Discovery instead of duplicate Resume Templates
  assert.match(
    dashboardSource,
    /Quick Action Cards Bar[\s\S]*to="\/career-discovery"[\s\S]*Career Discovery/,
    'Quick Action bar must feature Career Discovery'
  );
});

test('PublicNavbar and HomePage feature Career Discovery and exclude Resume Templates from Features', () => {
  const navbarSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'components', 'navbar', 'PublicNavbar.jsx'),
    'utf-8'
  );
  assert.match(navbarSource, /name:\s*'Career Discovery'/, 'PublicNavbar must feature Career Discovery');
  assert.match(navbarSource, /path:\s*'\/features\/career-discovery'/, 'PublicNavbar must link to /features/career-discovery');

  const homeSource = fs.readFileSync(
    path.join(projectRoot, 'src', 'pages', 'public', 'HomePage.jsx'),
    'utf-8'
  );
  assert.match(homeSource, /Pillar 2: Career Discovery/, 'HomePage must showcase Career Discovery as Pillar 2');
  assert.match(homeSource, /to="\/career-discovery"/, 'HomePage must link to /career-discovery');
});
