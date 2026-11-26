import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('announcementService exports required API methods', () => {
  const servicePath = path.join(projectRoot, 'src', 'services', 'announcementService.js');
  assert.ok(fs.existsSync(servicePath), 'announcementService.js must exist');
  const src = fs.readFileSync(servicePath, 'utf8');

  assert.match(src, /getActiveAnnouncements/, 'Must export getActiveAnnouncements');
  assert.match(src, /trackAnnouncement/, 'Must export trackAnnouncement');
  assert.match(src, /getAdminAnnouncements|listAllForAdmin/, 'Must export admin announcement listing');
  assert.match(src, /createAnnouncement/, 'Must export createAnnouncement');
  assert.match(src, /updateAnnouncement/, 'Must export updateAnnouncement');
  assert.match(src, /deleteAnnouncement/, 'Must export deleteAnnouncement');
});

test('WhatsNewModal renders carousel, exploration and deferral actions', () => {
  const modalPath = path.join(projectRoot, 'src', 'components', 'announcements', 'WhatsNewModal.jsx');
  assert.ok(fs.existsSync(modalPath), 'WhatsNewModal.jsx must exist');
  const src = fs.readFileSync(modalPath, 'utf8');

  assert.match(src, /What's New in AspirePath/, 'Modal must have feature announcement title');
  assert.match(src, /Explore Feature/, 'Must have primary action button');
  assert.match(src, /Maybe Later/, 'Must have secondary deferral button');
  assert.match(src, /onClose/, 'Must support dismissal');
});

test('WhatsNewDashboardWidget renders announcements and status badges', () => {
  const widgetPath = path.join(projectRoot, 'src', 'components', 'dashboard', 'WhatsNewDashboardWidget.jsx');
  assert.ok(fs.existsSync(widgetPath), 'WhatsNewDashboardWidget.jsx must exist');
  const src = fs.readFileSync(widgetPath, 'utf8');

  assert.match(src, /What's New in AspirePath/, 'Widget must display section title');
  assert.match(src, /unreadCount/, 'Widget must support unread count badge');
  assert.match(src, /Unexplored/, 'Widget must offer filter options');
  assert.match(src, /Explore Feature/, 'Widget must include explore link');
});

test('AdminAnnouncementsPage provides full announcement management', () => {
  const adminPagePath = path.join(projectRoot, 'src', 'pages', 'admin', 'AdminAnnouncementsPage.jsx');
  assert.ok(fs.existsSync(adminPagePath), 'AdminAnnouncementsPage.jsx must exist');
  const src = fs.readFileSync(adminPagePath, 'utf8');

  assert.match(src, /New Announcement/, 'Must provide create action');
  assert.match(src, /PUBLISHED/, 'Must support publish status');
  assert.match(src, /DRAFT/, 'Must support draft status');
  assert.match(src, /handleDeleteConfirm/, 'Must support delete action');
});

test('App.jsx and AdminLayout register announcement route and navigation', () => {
  const appPath = path.join(projectRoot, 'src', 'App.jsx');
  const layoutPath = path.join(projectRoot, 'src', 'layouts', 'AdminLayout', 'index.jsx');

  const appSrc = fs.readFileSync(appPath, 'utf8');
  const layoutSrc = fs.readFileSync(layoutPath, 'utf8');

  assert.match(appSrc, /AdminAnnouncementsPage/, 'App.jsx must import AdminAnnouncementsPage');
  assert.match(appSrc, /path="announcements"/, 'App.jsx must register admin announcements route');
  assert.match(layoutSrc, /\/admin\/announcements/, 'AdminLayout must include announcement navigation');
});

test('DashboardPage integrates WhatsNewModal and WhatsNewDashboardWidget', () => {
  const dashPath = path.join(projectRoot, 'src', 'pages', 'student', 'DashboardPage.jsx');
  const src = fs.readFileSync(dashPath, 'utf8');

  assert.match(src, /WhatsNewModal/, 'Must import and mount WhatsNewModal');
  assert.match(src, /WhatsNewDashboardWidget/, 'Must import and mount WhatsNewDashboardWidget');
  assert.match(src, /announcementService[\s\S]*?\.getActiveAnnouncements/, 'Must asynchronously fetch announcements');
});
