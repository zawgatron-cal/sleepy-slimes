import type { FusionRule, Slime } from '@/src/types';
import { FUSION_RULES_MASTER } from '@/src/data/fusionRules';
import { sortSlimesForFusionConsumption } from '@/src/utils/fusionConsumption';

export type TutorialFusionPair = {
  slotASlimeId: string;
  slotBSlimeId: string;
  rule: FusionRule;
};

/** Cheapest valid fusion the player can perform with current slimes. */
export function findTutorialFusionPair(
  slimes: Slime[],
  rules: FusionRule[] = FUSION_RULES_MASTER
): TutorialFusionPair | null {
  const bySpecies = new Map<string, Slime[]>();
  for (const slime of slimes) {
    if (slime.favorited) continue;
    const bucket = bySpecies.get(slime.speciesId) ?? [];
    bucket.push(slime);
    bySpecies.set(slime.speciesId, bucket);
  }

  const sortedRules = [...rules].sort((a, b) => a.candyCost - b.candyCost);

  for (const rule of sortedRules) {
    const sameSpecies = rule.parentSpeciesA === rule.parentSpeciesB;
    const poolA = bySpecies.get(rule.parentSpeciesA);
    const poolB = sameSpecies ? poolA : bySpecies.get(rule.parentSpeciesB);
    if (!poolA?.length || !poolB?.length) continue;

    const sortedA = sortSlimesForFusionConsumption(poolA);
    const slimeA = sortedA[0];
    const candidatesB = sameSpecies
      ? sortedA.filter((s) => s.id !== slimeA.id)
      : sortSlimesForFusionConsumption(poolB);
    const slimeB = candidatesB[0];
    if (!slimeA || !slimeB) continue;

    return {
      slotASlimeId: slimeA.id,
      slotBSlimeId: slimeB.id,
      rule,
    };
  }

  return null;
}
