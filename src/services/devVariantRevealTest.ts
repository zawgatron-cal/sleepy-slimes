/**
 * Dev — single-slime sleep reveal previews for prismatic / exotic / gold variants.
 */

import { SlimeVariant, Tier, type SlimeVariant as SlimeVariantType } from '@/src/constants/game';
import type { Slime, Species } from '@/src/types';
import { initialSlimeLevel } from '@/src/utils/slimeLevel';
import { generateSlimeSeed } from '@/src/utils/util';

const DEFAULT_TEST_SPECIES_IDS = ['grass_slime', 'moon_slime', 'rainbow_slime'] as const;

export type VariantRevealTestCase = {
  id: string;
  label: string;
  variant: SlimeVariantType;
  isNewSpecies: boolean;
  speciesId?: string;
};

export const VARIANT_REVEAL_TEST_CASES: VariantRevealTestCase[] = [
  {
    id: 'prismatic-dup',
    label: 'Prismatic (duplicate)',
    variant: SlimeVariant.PRISMATIC,
    isNewSpecies: false,
    speciesId: 'grass_slime',
  },
  {
    id: 'exotic-dup',
    label: 'Exotic (duplicate)',
    variant: SlimeVariant.EXOTIC,
    isNewSpecies: false,
    speciesId: 'grass_slime',
  },
  {
    id: 'gold-dup',
    label: 'Gold (duplicate)',
    variant: SlimeVariant.GOLD,
    isNewSpecies: false,
    speciesId: 'grass_slime',
  },
  {
    id: 'gold-new',
    label: 'Gold (new species)',
    variant: SlimeVariant.GOLD,
    isNewSpecies: true,
    speciesId: 'rainbow_slime',
  },
];

function resolveSpeciesId(speciesList: Species[], preferredId?: string): string {
  if (preferredId && speciesList.some((s) => s.id === preferredId)) {
    return preferredId;
  }

  for (const id of DEFAULT_TEST_SPECIES_IDS) {
    if (speciesList.some((s) => s.id === id)) return id;
  }

  const fallback = speciesList.find((s) => s.tier === Tier.RARE) ?? speciesList[0];
  if (!fallback) {
    throw new Error('No species available for variant reveal test');
  }
  return fallback.id;
}

export function buildVariantRevealTestSlime(
  endedAt: number,
  speciesList: Species[],
  testCase: VariantRevealTestCase
): Slime {
  const speciesId = resolveSpeciesId(speciesList, testCase.speciesId);

  return {
    id: `dev_variant_reveal_${testCase.id}_${endedAt}`,
    speciesId,
    variant: testCase.variant,
    level: initialSlimeLevel(),
    equippedNights: 0,
    seed: generateSlimeSeed(),
    acquiredAt: endedAt,
    source: 'sleep',
  };
}

export function describeVariantRevealTestCase(testCase: VariantRevealTestCase): string {
  const speciesNote = testCase.speciesId ?? 'auto';
  return `${testCase.label} · ${testCase.variant} · ${testCase.isNewSpecies ? 'new species' : 'duplicate'} · ${speciesNote}`;
}
