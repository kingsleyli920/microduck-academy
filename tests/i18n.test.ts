import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import { englishControlCopy, englishObservationGroups } from '../app/control-api.en.ts';
import { controlApi, observationGroups } from '../app/control-api.ts';
import { learningLevels, referenceProjects, rlContexts, uiCopy } from '../app/i18n.ts';
import { getLessons } from '../app/lessons.ts';

function objectKeys(value: object): string[] {
  return Object.keys(value).sort();
}

void test('Chinese and English lessons keep the same executable contract', () => {
  const chinese = getLessons('zh-CN');
  const english = getLessons('en');

  assert.equal(chinese.length, 9);
  assert.equal(english.length, chinese.length);

  for (let index = 0; index < chinese.length; index += 1) {
    const zh = chinese[index];
    const en = english[index];
    assert.equal(en.id, zh.id);
    assert.equal(en.filename, zh.filename);
    assert.equal(en.functionName, zh.functionName);
    assert.deepEqual(
      en.tests.map(({ args, expected }) => ({ args, expected })),
      zh.tests.map(({ args, expected }) => ({ args, expected })),
    );
  }
});

void test('shared UI and learning-path data have matching locale structure', () => {
  assert.deepEqual(objectKeys(uiCopy.en), objectKeys(uiCopy['zh-CN']));
  assert.equal(learningLevels.en.length, learningLevels['zh-CN'].length);
  assert.equal(referenceProjects.en.length, referenceProjects['zh-CN'].length);
  assert.deepEqual(objectKeys(rlContexts.en), objectKeys(rlContexts['zh-CN']));
});

void test('every published control API entry has English reference copy', () => {
  assert.equal(controlApi.length, 25);
  assert.deepEqual(
    objectKeys(englishControlCopy),
    controlApi.map(({ id }) => id).sort(),
  );
  assert.equal(englishObservationGroups.length, observationGroups.length);
});

void test('core repository documentation has Chinese and English editions', () => {
  const pairs = [
    ['README.en.md', 'README.md'],
    ['CODE_OF_CONDUCT.md', 'CODE_OF_CONDUCT.zh-CN.md'],
    ['CONTRIBUTING.md', 'CONTRIBUTING.zh-CN.md'],
    ['SECURITY.md', 'SECURITY.zh-CN.md'],
    ['SUPPORT.md', 'SUPPORT.zh-CN.md'],
    ['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.zh-CN.md'],
    ['docs/ARCHITECTURE.md', 'docs/ARCHITECTURE.zh-CN.md'],
    ['docs/CONTROL_API.md', 'docs/CONTROL_API.zh-CN.md'],
    ['docs/MAINTAINER_GUIDE.md', 'docs/MAINTAINER_GUIDE.zh-CN.md'],
    ['docs/OPEN_SOURCE_ROADMAP.md', 'docs/OPEN_SOURCE_ROADMAP.zh-CN.md'],
    ['docs/RELEASE_STATUS.md', 'docs/RELEASE_STATUS.zh-CN.md'],
    ['docs/REWARD_LAB.md', 'docs/REWARD_LAB.zh-CN.md'],
  ];

  for (const [english, chinese] of pairs) {
    assert.ok(existsSync(english), `${english} should exist`);
    assert.ok(existsSync(chinese), `${chinese} should exist`);
  }
});
