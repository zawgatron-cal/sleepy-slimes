/**
 * Dev — fixed fusion reveal scenarios for animation testing.
 */

import { Tier } from '@/src/constants/game';
import type { Species } from '@/src/types';

export type FusionRevealTestSession = {
  parentSpeciesAId: string;
  parentSpeciesBId: string;
  resultSpecies: Species;
  isNewSpecies: boolean;
};

/** Ultra Rare fusion: Butterfly + Phosphor → Firefly. */
const PREFERRED_FUSION_TEST = {
  parentSpeciesAId: 'butterfly_slime',
  parentSpeciesBId: 'phosphor_slime',
  resultSpeciesId: 'firefly_slime',
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
  isNewSpecies: boolean
): FusionRevealTestSession | null {
  const base = resolvePreferredFusionTest(speciesList) ?? resolveFallbackFusionTest(speciesList);
  if (!base) return null;
  return { ...base, isNewSpecies };
}

export function describeFusionRevealTestSession(session: FusionRevealTestSession): string {
  const tierLabel = session.resultSpecies.name;
  const mode = session.isNewSpecies ? 'new species' : 'duplicate';
  return `${tierLabel} (${mode})`;
}
