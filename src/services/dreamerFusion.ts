/**
 * Dreamer Slime — 4-parent legendary fusion (fixed species per slot).
 */

import { deleteSlime, insertSlime } from '@/src/db';
import {
  DREAMER_FUSION_CANDY_COST,
  DREAMER_FUSION_PARENT_SPECIES_IDS,
  DREAMER_FUSION_RESULT_SPECIES_ID,
} from '@/src/constants/dreamerFusion';
import { createFusionResultSlime } from '@/src/services/fusion';
import type { Slime, Species } from '@/src/types';

export type PerformDreamerFusionParams = {
  ownedSlimes: Slime[];
  /** One owned slime id per parent slot, in canonical slot order. */
  slotSlimeIds: [string, string, string, string];
  speciesById: Record<string, Species>;
};

export type PerformDreamerFusionSuccess = {
  ok: true;
  candyCost: number;
  resultSpecies: Species;
  consumedSlimeIds: [string, string, string, string];
  newSlime: Slime;
};

export type PerformDreamerFusionFailure = {
  ok: false;
  message: string;
};

export type PerformDreamerFusionResult =
  | PerformDreamerFusionSuccess
  | PerformDreamerFusionFailure;

export async function performDreamerFusion(
  params: PerformDreamerFusionParams
): Promise<PerformDreamerFusionResult> {
  const { ownedSlimes, slotSlimeIds, speciesById } = params;

  const uniqueIds = new Set(slotSlimeIds);
  if (uniqueIds.size !== slotSlimeIds.length) {
    return { ok: false, message: 'Each slot must use a different slime.' };
  }

  const consumedSlimes: Slime[] = [];
  for (let i = 0; i < DREAMER_FUSION_PARENT_SPECIES_IDS.length; i++) {
    const slimeId = slotSlimeIds[i];
    const requiredSpeciesId = DREAMER_FUSION_PARENT_SPECIES_IDS[i];
    const slime = ownedSlimes.find((s) => s.id === slimeId);
    if (!slime) {
      return { ok: false, message: 'Missing slime for one or more slots.' };
    }
    if (slime.speciesId !== requiredSpeciesId) {
      return { ok: false, message: 'Wrong species in one or more slots.' };
    }
    consumedSlimes.push(slime);
  }

  const resultSpecies = speciesById[DREAMER_FUSION_RESULT_SPECIES_ID];
  if (!resultSpecies) {
    return { ok: false, message: `Missing result species: ${DREAMER_FUSION_RESULT_SPECIES_ID}` };
  }

  const newSlime = await createFusionResultSlime(resultSpecies.id);
  const consumedSlimeIds = [...slotSlimeIds] as [string, string, string, string];

  try {
    await Promise.all([
      ...consumedSlimeIds.map((id) => deleteSlime(id)),
      insertSlime(newSlime),
    ]);
  } catch (e) {
    console.warn('performDreamerFusion persist failed', e);
    throw e;
  }

  return {
    ok: true,
    candyCost: DREAMER_FUSION_CANDY_COST,
    resultSpecies,
    consumedSlimeIds,
    newSlime,
  };
}
