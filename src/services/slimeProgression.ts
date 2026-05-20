/**
 * Slime level progression — equipped sleep nights + candy cost by species tier.
 */

import {
  applySlimeLevelUp,
  getSpecies,
  updateSlimeEquippedNights,
  updateSlimeLevel as updateSlimeLevelInDb,
} from '@/src/db';
import { useCandiesStore, useCollectionStore, useEquippedSlimeStore } from '@/src/stores';
import type { Slime, Species } from '@/src/types';
import type { Tier } from '@/src/constants/game';
import {
  evaluateSlimeLevelUp,
  parseEquippedNights,
  type SlimeLevelUpStatus,
} from '@/src/utils/slimeLevelUp';
import { parseSlimeLevel, withRaisedSlimeLevel } from '@/src/utils/slimeLevel';

export type { SlimeLevelUpStatus } from '@/src/utils/slimeLevelUp';

export type RaiseSlimeLevelResult =
  | { ok: true; slime: Slime }
  | {
      ok: false;
      reason:
        | 'not_found'
        | 'species_not_found'
        | 'max_level'
        | 'insufficient_nights'
        | 'insufficient_candies';
    };

function findSpeciesTier(speciesId: string, speciesList: Species[]): Tier | null {
  const species = speciesList.find((s) => s.id === speciesId);
  return species?.tier ?? null;
}

/** Read-only: can the player level this slime right now? */
export function getSlimeLevelUpStatus(
  slime: Slime,
  tier: Tier,
  candyBalance: number
): SlimeLevelUpStatus {
  return evaluateSlimeLevelUp(slime, tier, candyBalance);
}

/**
 * After a valid sleep session, increment equipped nights for the equipped slime (if any).
 */
export async function recordEquippedSlimeSleepNight(): Promise<void> {
  const equippedSlimeId = useEquippedSlimeStore.getState().equippedSlimeId;
  if (!equippedSlimeId) return;

  const slime = useCollectionStore.getState().getSlimeById(equippedSlimeId);
  if (!slime) return;

  const next = parseEquippedNights(slime.equippedNights) + 1;
  await updateSlimeEquippedNights(equippedSlimeId, next);
  useCollectionStore.getState().updateSlime(equippedSlimeId, { equippedNights: next });
}

/**
 * Level up one slime: spends candies, raises level, resets equipped nights for the new step.
 */
export async function raiseSlimeLevel(slimeId: string): Promise<RaiseSlimeLevelResult> {
  const slime = useCollectionStore.getState().getSlimeById(slimeId);
  if (!slime) {
    return { ok: false, reason: 'not_found' };
  }

  const speciesList = await getSpecies();
  const tier = findSpeciesTier(slime.speciesId, speciesList);
  if (tier == null) {
    return { ok: false, reason: 'species_not_found' };
  }

  const candyBalance = useCandiesStore.getState().total;
  const status = evaluateSlimeLevelUp(slime, tier, candyBalance);

  if (status.atMaxLevel) {
    return { ok: false, reason: 'max_level' };
  }
  if (!status.requirement) {
    return { ok: false, reason: 'max_level' };
  }
  if (!status.nightsMet) {
    return { ok: false, reason: 'insufficient_nights' };
  }
  if (!status.candiesMet) {
    return { ok: false, reason: 'insufficient_candies' };
  }

  const raised = withRaisedSlimeLevel(slime);
  if (!raised) {
    return { ok: false, reason: 'max_level' };
  }

  const spent = useCandiesStore.getState().spend(status.requirement.candies);
  if (!spent) {
    return { ok: false, reason: 'insufficient_candies' };
  }

  await applySlimeLevelUp(slimeId, raised.level);
  const updated: Slime = {
    ...raised,
    equippedNights: 0,
  };
  useCollectionStore.getState().updateSlime(slimeId, {
    level: updated.level,
    equippedNights: 0,
  });

  return { ok: true, slime: updated };
}

/** Dev / admin: set level and optionally equipped nights without spending candies. */
export async function setSlimeLevel(
  slimeId: string,
  level: Slime['level'],
  equippedNights?: number
): Promise<boolean> {
  const slime = useCollectionStore.getState().getSlimeById(slimeId);
  if (!slime) return false;

  const parsed = parseSlimeLevel(level);
  const nights =
    equippedNights != null ? parseEquippedNights(equippedNights) : slime.equippedNights;

  await updateSlimeLevelInDb(slimeId, parsed);
  if (equippedNights != null) {
    await updateSlimeEquippedNights(slimeId, nights);
  }
  useCollectionStore.getState().updateSlime(slimeId, {
    level: parsed,
    ...(equippedNights != null ? { equippedNights: nights } : {}),
  });
  return true;
}
