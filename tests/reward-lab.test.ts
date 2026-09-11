import assert from 'node:assert/strict';
import test from 'node:test';

import { defaultRewardConfigs, planarSpeedFromState, sanitizeRewardConfig, scoreRewardSample, terminationReason } from '../app/reward-lab.ts';

test('tracking reward prefers velocity close to the target', () => {
  const config = defaultRewardConfigs.A;
  const base = { gravityZ: -1, height: 0.3, action: Array(14).fill(0) };
  const exact = scoreRewardSample(config, { ...base, velocityX: config.targetSpeed }, null);
  const far = scoreRewardSample(config, { ...base, velocityX: -0.2 }, null);
  assert.ok(exact.tracking > far.tracking);
  assert.ok(exact.reward > far.reward);
});

test('effort and action changes subtract from reward', () => {
  const config = defaultRewardConfigs.A;
  const action = Array(14).fill(0.6);
  const scored = scoreRewardSample(config, { velocityX: config.targetSpeed, gravityZ: -1, height: 0.3, action }, Array(14).fill(0));
  assert.ok(scored.effort > 0);
  assert.ok(scored.smoothness > 0);
  assert.ok(scored.reward < config.trackingWeight + config.uprightWeight);
});

test('termination reports tilt and low trunk height', () => {
  const config = defaultRewardConfigs.A;
  const stable = { velocityX: 0, gravityZ: -0.9, height: 0.3, action: [] };
  assert.equal(terminationReason(config, stable), null);
  assert.equal(terminationReason(config, { ...stable, gravityZ: -0.4 }), 'tilt');
  assert.equal(terminationReason(config, { ...stable, height: 0.01 }), 'height');
});

test('persisted reward configs are bounded and repaired', () => {
  const result = sanitizeRewardConfig({ targetSpeed: 99, durationMs: Number.NaN, effortWeight: -4 }, defaultRewardConfigs.A);
  assert.equal(result.targetSpeed, 0.25);
  assert.equal(result.durationMs, 4000);
  assert.equal(result.effortWeight, 0);
});

test('planar speed matches the official simulator telemetry definition', () => {
  assert.equal(planarSpeedFromState([0.12, 0.16]), 0.2);
});
