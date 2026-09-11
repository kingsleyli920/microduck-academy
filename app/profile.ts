import { defaultRewardConfigs, sanitizeRewardConfig, type RewardConfig, type RewardSlot, type RolloutResult } from './reward-lab.ts';
import type { Locale } from './i18n.ts';

export type SavedProgress = {
  schemaVersion: number;
  locale: Locale;
  currentId: number;
  completed: number[];
  solutions: Record<number, string>;
  simulatorScript: string;
  simulatorRuns: number;
  level1Completed: number[];
  rewardConfigs: Record<RewardSlot, RewardConfig>;
  rewardResults: Partial<Record<RewardSlot, RolloutResult>>;
  level3Completed: number[];
  updatedAt: string;
};

const MAX_CODE_LENGTH = 50_000;
const MAX_RUN_COUNT = 1_000_000;
const terminationReasons = new Set(['timeout', 'tilt', 'height', 'stopped']);

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const integer = (value: unknown, fallback: number, min: number, max: number) =>
  Number.isInteger(value) ? Math.min(max, Math.max(min, value as number)) : fallback;
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value.slice(0, MAX_CODE_LENGTH) : fallback;
const ids = (value: unknown, max: number) => Array.isArray(value)
  ? Array.from(new Set(value.filter((id): id is number => Number.isInteger(id) && id >= 1 && id <= max))).sort((a, b) => a - b)
  : [];

function sanitizeSolutions(value: unknown, lessonCount: number): Record<number, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, code]) => {
    const id = Number(key);
    return Number.isInteger(id) && id >= 1 && id <= lessonCount && typeof code === 'string'
      ? [[id, code.slice(0, MAX_CODE_LENGTH)]]
      : [];
  }));
}

function sanitizeRollout(value: unknown, slot: RewardSlot): RolloutResult | undefined {
  if (!isRecord(value) || !isRecord(value.config) || !terminationReasons.has(String(value.terminatedBy))) return undefined;
  const numericKeys = ['durationSeconds', 'returnValue', 'meanSpeed', 'meanTrackingError', 'meanEffort', 'meanSmoothness', 'capturedAt'] as const;
  if (!numericKeys.every((key) => finite(value[key])) || !Number.isInteger(value.samples) || (value.samples as number) < 0) return undefined;
  return {
    slot,
    config: sanitizeRewardConfig(value.config, defaultRewardConfigs[slot]),
    samples: Math.min(MAX_RUN_COUNT, value.samples as number),
    durationSeconds: value.durationSeconds as number,
    returnValue: value.returnValue as number,
    meanSpeed: value.meanSpeed as number,
    meanTrackingError: value.meanTrackingError as number,
    meanEffort: value.meanEffort as number,
    meanSmoothness: value.meanSmoothness as number,
    terminatedBy: value.terminatedBy as RolloutResult['terminatedBy'],
    capturedAt: value.capturedAt as number,
  };
}

export function sanitizeLearningProfile(value: unknown, lessonCount: number): SavedProgress {
  if (!isRecord(value)) throw new Error('Invalid learning profile');
  if (!Number.isInteger(value.schemaVersion) || (value.schemaVersion as number) < 1 || (value.schemaVersion as number) > 7) {
    throw new Error('Unsupported learning profile schema');
  }
  const locale: Locale = value.locale === 'en' ? 'en' : 'zh-CN';
  const rawConfigs = isRecord(value.rewardConfigs) ? value.rewardConfigs : {};
  const rawResults = isRecord(value.rewardResults) ? value.rewardResults : {};
  const resultA = sanitizeRollout(rawResults.A, 'A');
  const resultB = sanitizeRollout(rawResults.B, 'B');
  return {
    schemaVersion: integer(value.schemaVersion, 0, 0, 10_000),
    locale,
    currentId: integer(value.currentId, 1, 1, lessonCount),
    completed: ids(value.completed, lessonCount),
    solutions: sanitizeSolutions(value.solutions, lessonCount),
    simulatorScript: text(value.simulatorScript),
    simulatorRuns: integer(value.simulatorRuns, 0, 0, MAX_RUN_COUNT),
    level1Completed: ids(value.level1Completed, 6),
    rewardConfigs: {
      A: sanitizeRewardConfig(isRecord(rawConfigs.A) ? rawConfigs.A : {}, defaultRewardConfigs.A),
      B: sanitizeRewardConfig(isRecord(rawConfigs.B) ? rawConfigs.B : {}, defaultRewardConfigs.B),
    },
    rewardResults: { ...(resultA ? { A: resultA } : {}), ...(resultB ? { B: resultB } : {}) },
    level3Completed: ids(value.level3Completed, 4),
    updatedAt: typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt)) ? value.updatedAt : new Date(0).toISOString(),
  };
}
