/**
 * Dev — fixed 5-slime reveal sequence for tier animation testing.
 */

import { SlimeVariant, Tier, type Tier as TierType } from '@/src/constants/game';
import { useDevSettingsStore } from '@/src/stores/useDevSettingsStore';
import type { Slime, Species } from '@/src/types';
import { initialSlimeLevel } from '@/src/utils/slimeLevel';
import { generateSlimeSeed } from '@/src/utils/util';

/** One slime per tier step: Common → Uncommon → Rare → Ultra Rare ×2. */
export const FIXED_REVEAL_TEST_TIERS: TierType[] = [
  Tier.COMMON,
  Tier.UNCOMMON,
  Tier.RARE,
  Tier.ULTRA_RARE,
  Tier.ULTRA_RARE,
];

export const FIXED_REVEAL_TEST_TIER_LABELS = [
  'Common',
  'Uncommon',
  'Rare',
  'Ultra Rare',
  'Ultra Rare',
] as const;

const PREFERRED_SPECIES_BY_TIER: Partial<Record<TierType, string[]>> = {
  [Tier.COMMON]: ['grass_slime'],
  [Tier.UNCOMMON]: ['berry_slime'],
  [Tier.RARE]: ['moon_slime'],
  [Tier.ULTRA_RARE]: ['rainbow_slime', 'aurora_slime'],
};

function resolveSpeciesIdForTier(
  speciesList: Species[],
  tier: TierType,
  indexWithinTier: number
): string {
  const preferred = PREFERRED_SPECIES_BY_TIER[tier];
  const preferredId = preferred?.[indexWithinTier];
  if (preferredId && speciesList.some((s) => s.id === preferredId)) {
    return preferredId;
  }

  const candidates = speciesList.filter((s) => s.tier === tier);
  if (candidates.length === 0) {
    throw new Error(`No species found for tier ${tier}`);
  }
  return candidates[indexWithinTier % candidates.length]!.id;
}

export function buildFixedTierRevealTestSlimes(
  endedAt: number,
  speciesList: Species[]
): Slime[] {
  const tierUseCount = new Map<TierType, number>();

  return FIXED_REVEAL_TEST_TIERS.map((tier, index) => {
    const indexWithinTier = tierUseCount.get(tier) ?? 0;
    tierUseCount.set(tier, indexWithinTier + 1);

    return {
      id: `dev_reveal_test_${endedAt}_${index}_${Math.random().toString(36).slice(2, 7)}`,
      speciesId: resolveSpeciesIdForTier(speciesList, tier, indexWithinTier),
      variant: SlimeVariant.STANDARD,
      level: initialSlimeLevel(),
      equippedNights: 0,
      seed: generateSlimeSeed(),
      acquiredAt: endedAt + index,
      source: 'sleep',
    };
  });
}

export function isFixedTierRevealTestEnabled(): boolean {
  return __DEV__ && useDevSettingsStore.getState().fixedTierRevealTest;
}
