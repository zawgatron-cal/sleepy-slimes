/**
 * Hidden sleep-stats variant bonus (not surfaced in UI).
 * Active when recent consistency and avg quality are both above threshold.
 * Applies to sleep spawns and fusion offspring rolls.
 */

import { getSleepSessions } from '@/src/db';
import type { VariantDropBonus } from '@/src/utils/slimeVariant';
import { computeSleepConsistencyScore } from '@/src/utils/sleepDataConsistency';
import { computeAverageSleepQuality } from '@/src/utils/sleepQuality';
import type { SleepSession } from '@/src/types';

/** Both stats must be strictly greater than this (0–1 scale). */
export const SLEEP_SECRET_STATS_THRESHOLD = 0.8;

/** +0.4% Prismatic ("shiny") drop weight when the secret is active. */
export const SLEEP_SECRET_PRISMATIC_PERCENT_ADD = 0.4;

/** +0.04% Gold drop weight when the secret is active. */
export const SLEEP_SECRET_GOLD_PERCENT_ADD = 0.04;

export function isSleepSecretVariantBonusActive(
  sessions: readonly SleepSession[]
): boolean {
  const consistency = computeSleepConsistencyScore(sessions);
  const avgQuality = computeAverageSleepQuality(sessions);
  if (consistency == null || avgQuality == null) return false;
  return (
    consistency > SLEEP_SECRET_STATS_THRESHOLD && avgQuality > SLEEP_SECRET_STATS_THRESHOLD
  );
}

/** Variant roll bonus from sleep data stats; undefined when inactive. */
export function getSleepSecretVariantBonus(
  sessions: readonly SleepSession[]
): VariantDropBonus | undefined {
  if (!isSleepSecretVariantBonusActive(sessions)) return undefined;
  return {
    prismaticPercentAdd: SLEEP_SECRET_PRISMATIC_PERCENT_ADD,
    goldPercentAdd: SLEEP_SECRET_GOLD_PERCENT_ADD,
  };
}

/** Load saved sessions and resolve the secret variant bonus (fusion + simulators). */
export async function loadSleepSecretVariantBonus(): Promise<VariantDropBonus | undefined> {
  const sessions = await getSleepSessions();
  return getSleepSecretVariantBonus(sessions);
}
