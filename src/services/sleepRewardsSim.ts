/**
 * Dev / tooling: run `computeSleepRewards` without going through the Sleep UI.
 * Supports dry-run batches (averages) or applying one session to DB + stores.
 */

import { insertSleepSession, insertSlime } from '@/src/db';
import type { SleepRewardResult } from '@/src/services/sleepRewards';
import { computeSleepRewards, resolveSleepRewardModifiers } from '@/src/services/sleepRewards';
import { recordEquippedSlimeSleepNight } from '@/src/services/slimeProgression';
import { refreshSleepStreakFromDb } from '@/src/services/sleepStreakSync';
import { useCandiesStore, useCollectionStore } from '@/src/stores';
import {
  MIN_VALID_SLEEP_SECONDS,
  SLIME_VARIANT_LABELS,
  SlimeVariant as SlimeVariantEnum,
  type SlimeVariant,
} from '@/src/constants/game';
import {
  formatVariantDropPct,
  getVariantDropPercentages,
  type VariantDropBonus,
} from '@/src/utils/slimeVariant';

export type SimulateSleepRun = {
  valid: boolean;
  durationSeconds: number;
  candies: number;
  slimeCount: number;
  speciesIds: string[];
  variants: SlimeVariant[];
  streakValue: number;
};

export type SimulateSleepAverages = {
  validRunCount: number;
  candies: number;
  slimeCount: number;
};

export type SimulateSleepRewardsParams = {
  durationSeconds: number;
  zoneId: string;
  /** How many independent rolls (default 1). */
  runCount?: number;
  /** Persist session, candies, slimes, refresh streak (default false). */
  applyRewards?: boolean;
};

export type SimulateSleepVariantTotals = {
  totalSlimes: number;
  validRunCount: number;
  counts: Record<SlimeVariant, number>;
};

export type SimulateSleepRewardsResult = {
  runs: SimulateSleepRun[];
  averages: SimulateSleepAverages | null;
  variantTotals: SimulateSleepVariantTotals;
  applied: boolean;
};

function emptyVariantCounts(): Record<SlimeVariant, number> {
  return {
    [SlimeVariantEnum.STANDARD]: 0,
    [SlimeVariantEnum.PRISMATIC]: 0,
    [SlimeVariantEnum.EXOTIC]: 0,
    [SlimeVariantEnum.GOLD]: 0,
  };
}

/** Sum variant rolls across all valid simulated runs. */
export function aggregateVariantCounts(runs: SimulateSleepRun[]): SimulateSleepVariantTotals {
  const counts = emptyVariantCounts();
  let totalSlimes = 0;
  let validRunCount = 0;

  for (const run of runs) {
    if (!run.valid) continue;
    validRunCount++;
    for (const variant of run.variants) {
      counts[variant] += 1;
      totalSlimes++;
    }
  }

  return { totalSlimes, validRunCount, counts };
}

export function formatVariantTotalsLine(
  variant: SlimeVariant,
  count: number,
  totalSlimes: number
): string {
  const label = SLIME_VARIANT_LABELS[variant];
  const pct = totalSlimes > 0 ? ((count / totalSlimes) * 100).toFixed(2) : '0.00';
  return `${label}: ${count} (${pct}%)`;
}

export function expectedVariantDropPct(
  variant: SlimeVariant,
  bonus?: VariantDropBonus
): string {
  const pct = getVariantDropPercentages(bonus)[variant];
  return formatVariantDropPct(variant, pct).replace('%', '');
}

/** Write a valid `computeSleepRewards` result to SQLite and Zustand. */
export async function applySleepRewardResult(result: SleepRewardResult): Promise<void> {
  if (!result.valid) {
    throw new Error('Cannot apply rewards for an invalid session');
  }

  await insertSleepSession(result.session);
  useCandiesStore.getState().add(result.candies);

  for (const slime of result.slimes) {
    await insertSlime(slime);
    useCollectionStore.getState().addSlime(slime);
  }

  await recordEquippedSlimeSleepNight();
  await refreshSleepStreakFromDb();
}

function averageRuns(runs: SimulateSleepRun[]): SimulateSleepAverages | null {
  const valid = runs.filter((r) => r.valid);
  if (valid.length === 0) return null;

  const candies = valid.reduce((s, r) => s + r.candies, 0) / valid.length;
  const slimeCount = valid.reduce((s, r) => s + r.slimeCount, 0) / valid.length;
  return { validRunCount: valid.length, candies, slimeCount };
}

/**
 * Simulate one or more sleep sessions with the live reward algorithms.
 * Uses current DB state for streak modifiers; each run re-rolls candy count and slimes.
 */
export async function simulateSleepRewards(
  params: SimulateSleepRewardsParams
): Promise<SimulateSleepRewardsResult> {
  const { durationSeconds, zoneId, runCount = 1, applyRewards = false } = params;

  const runs: SimulateSleepRun[] = [];
  let lastResult: SleepRewardResult | null = null;

  for (let i = 0; i < runCount; i++) {
    const endedAt = Date.now() + i;
    const startedAt = endedAt - durationSeconds * 1000;
    const modifiers = await resolveSleepRewardModifiers(startedAt);
    const result = await computeSleepRewards(startedAt, endedAt, zoneId);

    runs.push({
      valid: result.valid,
      durationSeconds: result.durationSeconds,
      candies: result.candies,
      slimeCount: result.slimes.length,
      speciesIds: result.slimes.map((s) => s.speciesId),
      variants: result.slimes.map((s) => s.variant),
      streakValue: modifiers.streakValue,
    });

    if (result.valid) {
      lastResult = result;
    }
  }

  let applied = false;
  if (applyRewards && lastResult?.valid) {
    await applySleepRewardResult(lastResult);
    applied = true;
  }

  return {
    runs,
    averages: runCount > 1 ? averageRuns(runs) : null,
    variantTotals: aggregateVariantCounts(runs),
    applied,
  };
}

export function formatMinValidSleepHint(): string {
  return `Duration must be at least ${MIN_VALID_SLEEP_SECONDS}s for a valid session.`;
}
