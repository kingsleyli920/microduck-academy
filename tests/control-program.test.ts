import assert from 'node:assert/strict';
import test from 'node:test';

import { controlApi } from '../app/control-api.ts';
import { parseControlProgram, parseNumberArguments } from '../app/control-program.ts';

test('parses nested feedback programs and preserves source lines', () => {
  const program = parseControlProgram(`
# closed-loop example
repeat(2) {
  drive(0.1, 0, 200)
  if obs[5] < -0.8 {
    skill("roll")
  }
}
`);
  assert.equal(program.length, 1);
  assert.equal(program[0].type, 'repeat');
  if (program[0].type !== 'repeat') return;
  assert.equal(program[0].count, 2);
  assert.equal(program[0].children.length, 2);
  assert.equal(program[0].children[1].type, 'condition');
});

test('every published API example is valid control.duck syntax', () => {
  assert.equal(controlApi.length, 25);
  for (const entry of controlApi) {
    assert.doesNotThrow(() => parseControlProgram(entry.example), entry.signature);
  }
});

test('rejects unsafe loop counts, observation indexes, and incomplete blocks', () => {
  assert.throws(() => parseControlProgram('repeat(21) {\nreset()\n}'), /1–20/);
  assert.throws(() => parseControlProgram('if obs[61] < 0 {\nreset()\n}'), /0–60/);
  assert.throws(() => parseControlProgram('repeat(2) {\nreset()'), /缺少一个/);
});

test('accepts only the requested number of finite numeric arguments', () => {
  assert.deepEqual(parseNumberArguments('0.2, -0.5, 1000', 1, 3), [0.2, -0.5, 1000]);
  assert.throws(() => parseNumberArguments('0.2, nope, 1000', 4, 3), /第 4 行/);
  assert.throws(() => parseNumberArguments('0.2, 1000', 5, 3), /需要 3 个/);
});
