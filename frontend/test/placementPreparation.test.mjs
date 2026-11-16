import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('placementPrepService exports required student and admin methods', async () => {
  const serviceFile = path.resolve('src/services/placementPrepService.js');
  assert.ok(fs.existsSync(serviceFile), 'placementPrepService.js file must exist');

  const content = fs.readFileSync(serviceFile, 'utf8');
  assert.match(content, /getRoles:/, 'Must define getRoles method');
  assert.match(content, /getRoleBySlug:/, 'Must define getRoleBySlug method');
  assert.match(content, /getRoleMaterials:/, 'Must define getRoleMaterials method');
  assert.match(content, /getPreviewUrl:/, 'Must define getPreviewUrl method');
  assert.match(content, /getDownloadUrl:/, 'Must define getDownloadUrl method');
  assert.match(content, /adminGetRoles:/, 'Must define adminGetRoles method');
  assert.match(content, /adminUploadMaterial:/, 'Must define adminUploadMaterial method');
  assert.match(content, /adminReplaceMaterialPdf:/, 'Must define adminReplaceMaterialPdf method');
  assert.match(content, /adminDeleteMaterial:/, 'Must define adminDeleteMaterial method');
});

test('StudentLayout places Placement Preparation below Skill Intelligence in Career Tools', () => {
  const layoutFile = path.resolve('src/layouts/StudentLayout/index.jsx');
  const content = fs.readFileSync(layoutFile, 'utf8');

  assert.match(content, /Placement Preparation/, 'Must include Placement Preparation in navigation');
  assert.match(content, /\/placement-preparation/, 'Must link to /placement-preparation route');

  const skillIdx = content.indexOf('/skill-intelligence');
  const prepIdx = content.indexOf('/placement-preparation');

  assert.ok(skillIdx !== -1, 'Skill Intelligence route must exist in StudentLayout');
  assert.ok(prepIdx !== -1, 'Placement Preparation route must exist in StudentLayout');
  assert.ok(prepIdx > skillIdx, 'Placement Preparation must be placed after Skill Intelligence');
});

test('AdminLayout includes Placement Preparation in Platform Administration navigation', () => {
  const adminLayoutFile = path.resolve('src/layouts/AdminLayout/index.jsx');
  const content = fs.readFileSync(adminLayoutFile, 'utf8');

  assert.match(content, /Placement Preparation/, 'Must include Placement Preparation in admin nav');
  assert.match(content, /\/admin\/placement-preparation/, 'Must link to /admin/placement-preparation route');
});

test('App.jsx registers Placement Preparation student and admin routes', () => {
  const appFile = path.resolve('src/App.jsx');
  const content = fs.readFileSync(appFile, 'utf8');

  assert.match(content, /path="\/placement-preparation"/, 'Must register /placement-preparation route');
  assert.match(content, /path="\/placement-preparation\/:roleSlug"/, 'Must register /placement-preparation/:roleSlug route');
  assert.match(content, /path="placement-preparation"/, 'Must register admin placement-preparation route');
});

test('Backend models declare PreparationRole, PreparationTopic, PreparationMaterial', () => {
  const modelsFile = path.resolve('../backend/app/models/placement_preparation.py');
  assert.ok(fs.existsSync(modelsFile), 'placement_preparation.py models file must exist');

  const content = fs.readFileSync(modelsFile, 'utf8');
  assert.match(content, /class PreparationRole/, 'Must declare PreparationRole model');
  assert.match(content, /class PreparationTopic/, 'Must declare PreparationTopic model');
  assert.match(content, /class PreparationMaterial/, 'Must declare PreparationMaterial model');
});
