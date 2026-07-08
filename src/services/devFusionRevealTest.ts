/**
 * Dev — fixed fusion reveal scenarios for animation testing.
 */

import { SlimeVariant, Tier } from '@/src/constants/game';
import type { Species } from '@/src/types';

export type FusionRevealTestSession = {
  parentSpeciesAId: string;
  parentSpeciesBId: string;
  resultSpecies: Species;
  isNewSpecies: boolean;
  resultVariant?: SlimeVariant;
};

/** Ultra Rare fusion: Butterfly + Phosphor → Firefly. */
const PREFERRED_FUSION_TEST = {
  parentSpeciesAId: 'battery_slime',
  parentSpeciesBId: 'golem_slime',
  resultSpeciesId: 'robo_slime',
} as const;

function resolvePreferredFusionTest(speciesList: Species[]): FusionRevealTestSession | null {
  const byId = new Map(speciesList.map((s) => [s.id, s]));
  const resultSpecies = byId.get(PREFERRED_FUSION_TEST.resultSpeciesId);
  if (
    !byId.has(PREFERRED_FUSION_TEST.parentSpeciesAId) ||
    !byId.has(PREFERRED_FUSION_TEST.parentSpeciesBId) ||
    !resultSpecies
  ) {
    return null;
  }

  return {
    parentSpeciesAId: PREFERRED_FUSION_TEST.parentSpeciesAId,
    parentSpeciesBId: PREFERRED_FUSION_TEST.parentSpeciesBId,
    resultSpecies,
    isNewSpecies: true,
  };
}

function resolveFallbackFusionTest(speciesList: Species[]): FusionRevealTestSession | null {
  const ultraRare = speciesList.find((s) => s.tier === Tier.ULTRA_RARE);
  const parents = speciesList.filter((s) => s.id !== ultraRare?.id);
  if (!ultraRare || parents.length < 2) return null;

  return {
    parentSpeciesAId: parents[0]!.id,
    parentSpeciesBId: parents[1]!.id,
    resultSpecies: ultraRare,
    isNewSpecies: true,
  };
}

export function buildFusionRevealTestSession(
  speciesList: Species[],
  isNewSpecies: boolean,
  resultVariant?: SlimeVariant
): FusionRevealTestSession | null {
  const base = resolvePreferredFusionTest(speciesList) ?? resolveFallbackFusionTest(speciesList);
  if (!base) return null;
  return { ...base, isNewSpecies, resultVariant };
}

export function describeFusionRevealTestSession(session: FusionRevealTestSession): string {
  const tierLabel = session.resultSpecies.name;
  const mode = session.isNewSpecies ? 'new species' : 'duplicate';
  const variantSuffix =
    session.resultVariant && session.resultVariant !== SlimeVariant.STANDARD
      ? `, ${session.resultVariant}`
      : '';
  return `${tierLabel} (${mode}${variantSuffix})`;
}
