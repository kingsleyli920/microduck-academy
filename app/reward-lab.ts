export type RewardSlot = 'A' | 'B';

export type RewardConfig = {
  targetSpeed: number;
  durationMs: number;
  trackingWeight: number;
  uprightWeight: number;
  effortWeight: number;
  smoothnessWeight: number;
  terminationGravityZ: number;
  minHeight: number;
};

export type RewardSample = {
  planarSpeed: number;
  gravityZ: number;
  height: number;
  action: number[];
};

export type RewardBreakdown = {
  tracking: number;
  upright: number;
  effort: number;
  smoothness: number;
  reward: number;
};

export type RolloutResult = {
  slot: RewardSlot;
  config: RewardConfig;
  samples: number;
  durationSeconds: number;
  returnValue: number;
  meanSpeed: number;
  meanTrackingError: number;
  meanEffort: number;
  meanSmoothness: number;
  terminatedBy: 'timeout' | 'tilt' | 'height' | 'stopped';
  capturedAt: number;
};

export const defaultRewardConfigs: Record<RewardSlot, RewardConfig> = {
  A: {
    targetSpeed: 0.24,
    durationMs: 4000,
    trackingWeight: 1,
    uprightWeight: 0.5,
    effortWeight: 0.05,
    smoothnessWeight: 0.02,
    terminationGravityZ: -0.55,
    minHeight: 0.08,
  },
  B: {
    targetSpeed: 0.24,
    durationMs: 4000,
    trackingWeight: 2,
    uprightWeight: 0.2,
    effortWeight: 0.01,
    smoothnessWeight: 0,
    terminationGravityZ: -0.55,
    minHeight: 0.08,
  },
};

const meanSquare = (values: number[]) => values.length
  ? values.reduce((sum, value) => sum + value * value, 0) / values.length
  : 0;

export function scoreRewardSample(config: RewardConfig, sample: RewardSample, previousAction: number[] | null): RewardBreakdown {
  const error = sample.planarSpeed - config.targetSpeed;
  const tracking = Math.exp(-4 * error * error);
  const upright = Math.max(0, Math.min(1, -sample.gravityZ));
  const effort = meanSquare(sample.action);
  const smoothness = previousAction
    ? meanSquare(sample.action.map((value, index) => value - (previousAction[index] ?? 0)))
    : 0;
  const reward = config.trackingWeight * tracking
    + config.uprightWeight * upright
    - config.effortWeight * effort
    - config.smoothnessWeight * smoothness;
  return { tracking, upright, effort, smoothness, reward };
}

export function terminationReason(config: RewardConfig, sample: RewardSample): 'tilt' | 'height' | null {
  if (sample.gravityZ > config.terminationGravityZ) return 'tilt';
  if (sample.height < config.minHeight) return 'height';
  return null;
}

export function planarSpeedFromState(qvel: ArrayLike<number>): number {
  return Math.hypot(Number(qvel[0]), Number(qvel[1]));
}

export function sanitizeRewardConfig(value: Partial<RewardConfig>, fallback: RewardConfig): RewardConfig {
  const finite = (candidate: unknown, defaultValue: number, min: number, max: number) => {
    const number = typeof candidate === 'number' ? candidate : Number.NaN;
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : defaultValue;
  };
  return {
    targetSpeed: finite(value.targetSpeed, fallback.targetSpeed, 0, 0.25),
    durationMs: finite(value.durationMs, fallback.durationMs, 1000, 8000),
    trackingWeight: finite(value.trackingWeight, fallback.trackingWeight, 0, 5),
    uprightWeight: finite(value.uprightWeight, fallback.uprightWeight, 0, 5),
    effortWeight: finite(value.effortWeight, fallback.effortWeight, 0, 2),
    smoothnessWeight: finite(value.smoothnessWeight, fallback.smoothnessWeight, 0, 2),
    terminationGravityZ: finite(value.terminationGravityZ, fallback.terminationGravityZ, -0.95, -0.1),
    minHeight: finite(value.minHeight, fallback.minHeight, 0.02, 0.4),
  };
}
