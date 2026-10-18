import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SKILL_STATUS_OPTIONS,
  calculateStageProgress,
  getPriorityBadgeClass,
  getStatusBadgeClass,
  normalizeRoleTitle,
  getFitLevelBadgeClass,
  formatMatchPercentage,
} from '../src/utils/skillIntelligence.js';

test('SKILL_STATUS_OPTIONS includes exactly the 4 required progression states', () => {
  assert.equal(SKILL_STATUS_OPTIONS.length, 4);
  assert.deepEqual(SKILL_STATUS_OPTIONS, [
    'Not Started',
    'Learning',
    'Practiced',
    'Completed',
  ]);
});

test('calculateStageProgress accurately computes completion percentages without mock values', () => {
  assert.equal(calculateStageProgress([]), 0);
  assert.equal(
    calculateStageProgress([
      { current_status: 'Completed' },
      { current_status: 'Learning' },
      { current_status: 'Not Started' },
      { current_status: 'Practiced' },
    ]),
    25
  );
  assert.equal(
    calculateStageProgress([
      { current_status: 'Completed' },
      { current_status: 'Completed' },
    ]),
    100
  );
});

test('getPriorityBadgeClass returns accessible styling classes for each level', () => {
  assert.ok(getPriorityBadgeClass('High').includes('rose'));
  assert.ok(getPriorityBadgeClass('Medium').includes('amber'));
  assert.ok(getPriorityBadgeClass('Low').includes('slate'));
  assert.ok(getPriorityBadgeClass('Unknown').includes('slate'));
});

test('getStatusBadgeClass returns appropriate semantic color badges', () => {
  assert.ok(getStatusBadgeClass('Completed').includes('emerald'));
  assert.ok(getStatusBadgeClass('Learning').includes('blue'));
  assert.ok(getStatusBadgeClass('Practiced').includes('cyan'));
  assert.ok(getStatusBadgeClass('Not Started').includes('slate'));
});

test('normalizeRoleTitle cleans and falls back safely', () => {
  assert.equal(normalizeRoleTitle('  Frontend Developer  '), 'Frontend Developer');
  assert.equal(normalizeRoleTitle(null), 'Software Engineer');
  assert.equal(normalizeRoleTitle(''), 'Software Engineer');
});

test('getFitLevelBadgeClass returns correct styling classes for role fit levels', () => {
  assert.ok(getFitLevelBadgeClass('Strong Match').includes('emerald'));
  assert.ok(getFitLevelBadgeClass('Good Fit').includes('blue'));
  assert.ok(getFitLevelBadgeClass('Moderate Fit').includes('amber'));
  assert.ok(getFitLevelBadgeClass('Developing').includes('slate'));
});

test('formatMatchPercentage returns rounded percentage strings', () => {
  assert.equal(formatMatchPercentage(74.6), '75%');
  assert.equal(formatMatchPercentage(100), '100%');
  assert.equal(formatMatchPercentage('62.3'), '62%');
  assert.equal(formatMatchPercentage(null), '0%');
});
