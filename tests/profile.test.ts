import assert from 'node:assert/strict';
import test from 'node:test';

import { sanitizeLearningProfile } from '../app/profile.ts';

void test('learning profiles filter invalid ids, code, counts, and rollout results', () => {
  const profile = sanitizeLearningProfile({
    schemaVersion: 7, locale: 'en', currentId: 99, completed: [2, 2, 0, 9, '3'],
    solutions: { 1: 'return 1', 10: 'outside', x: 'bad', 2: 42 },
    simulatorScript: 'drive(0.1, 0, 100)', simulatorRuns: -5,
    level1Completed: [1, 7], level3Completed: [4, 5],
    rewardConfigs: { A: { targetSpeed: 99 }, B: {} },
    rewardResults: { A: { returnValue: 'boom' }, B: null },
    updatedAt: 'not a date',
  }, 9);
  assert.equal(profile.currentId, 9);
  assert.deepEqual(profile.completed, [2, 9]);
  assert.deepEqual(profile.solutions, { 1: 'return 1' });
  assert.equal(profile.simulatorRuns, 0);
  assert.deepEqual(profile.level1Completed, [1]);
  assert.deepEqual(profile.level3Completed, [4]);
  assert.equal(profile.rewardConfigs.A.targetSpeed, 0.25);
  assert.deepEqual(profile.rewardResults, {});
});

void test('learning profile must be an object', () => {
  assert.throws(() => sanitizeLearningProfile(null, 9));
  assert.throws(() => sanitizeLearningProfile([], 9));
});

void test('learning profile rejects missing, invalid, and future schema versions', () => {
  assert.throws(() => sanitizeLearningProfile({}, 9), /schema/);
  assert.throws(() => sanitizeLearningProfile({ schemaVersion: 0 }, 9), /schema/);
  assert.throws(() => sanitizeLearningProfile({ schemaVersion: 7.5 }, 9), /schema/);
  assert.throws(() => sanitizeLearningProfile({ schemaVersion: 8 }, 9), /schema/);
});
