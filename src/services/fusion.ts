/**
 * Fusion logic: resolve parent-pair recipes, pick outcome, consume two instances, mint one result.
 * PRD: two slimes + candy cost → one slime; rules from SQLite (order-agnostic parents).
 *
 * Structure:
 * 1. Recipe — load/filter rules, candy cost, choose deterministic vs weighted outcome.
 * 2. Parents — pick concrete collection instances to delete.
 * 3. Result — build the new Slime row (variant roll later).
 * 4. `performFusion` — runs (2)+(3) and persists deletes/insert (caller handles candy + UI store).
 */

import { deleteSlime, getFusionResultsForParents, insertSlime } from '@/src/db';
import type { FusionRule, Slime, Species } from '@/src/types';
import { initialSlimeLevel } from '@/src/utils/slimeLevel';
import { rollSlimeVariant } from '@/src/utils/slimeVariant';
import { generateSlimeSeed, pickWeighted, randomShortId } from '@/src/utils/util';

// --- Shared types ---

export type FusionFailureReason =
  | 'no_recipe'
  | 'missing_parent_a'
  | 'missing_parent_b'
  | 'missing_result_species';

export type PerformFusionParams = {
  /** Rules already scoped to the current slot pair (see `fetchRulesForParentPair`). */
  rulesForPair: FusionRule[];
  ownedSlimes: Slime[];
  slotASpeciesId: string;
  slotBSpeciesId: string;
  speciesById: Record<string, Species>;
};

export type PerformFusionSuccess = {
  ok: true;
  candyCost: number;
  chosenRule: FusionRule;
  resultSpecies: Species;
  consumedSlimeIds: [string, string];
  newSlime: Slime;
};

export type PerformFusionFailure = {
  ok: false;
  reason: FusionFailureReason;
  message?: string;
};

export type PerformFusionResult = PerformFusionSuccess | PerformFusionFailure;

// --- Recipe ---
//
// Flow: load rules for parent ids (order-agnostic in SQL) → filter to current pair →
// read candy cost → on fuse, prefer deterministic rule else weighted pick.

/** Keep only rows that match this parent pair (either order). */
export function filterRulesForParentPair(
  rules: FusionRule[],
  parentSpeciesA: string,
  parentSpeciesB: string
): FusionRule[] {
  return rules.filter(
    (r) =>
      (r.parentSpeciesA === parentSpeciesA && r.parentSpeciesB === parentSpeciesB) ||
      (r.parentSpeciesA === parentSpeciesB && r.parentSpeciesB === parentSpeciesA)
  );
}

/** Load fusion rules from DB and filter to the given parent species ids. */
export async function fetchRulesForParentPair(
  parentSpeciesA: string,
  parentSpeciesB: string
): Promise<FusionRule[]> {
  const rules = await getFusionResultsForParents(parentSpeciesA, parentSpeciesB);
  return filterRulesForParentPair(rules, parentSpeciesA, parentSpeciesB);
}

/**
 * Candy cost for a pair. All rules for a pair share the same cost by design.
 * Returns 0 when there is no recipe.
 */
export function getFusionCandyCost(rulesForPair: FusionRule[]): number {
  if (rulesForPair.length === 0) return 0;
  return rulesForPair[0]?.candyCost ?? 0;
}

/**
 * Choose which fusion_rules row applies for this fuse attempt.
 * Deterministic recipes win; otherwise weighted by `weight` on probabilistic rows.
 */
export function chooseFusionRule(rulesForPair: FusionRule[]): FusionRule {
  if (rulesForPair.length === 0) {
    throw new Error('chooseFusionRule called with no rules');
  }
  const deterministic = rulesForPair.filter((r) => r.deterministic);
  return deterministic.length > 0 ? deterministic[0] : pickWeighted(rulesForPair);
}

// --- Parents ---
//
// Flow: copy owned slimes → find one instance per slot species → return ids to delete.

export type SelectedFusionParents = {
  slimeA: Slime;
  slimeB: Slime;
};

/**
 * Pick one owned instance per slot species. Removes chosen A from the pool before picking B
 * so the same physical slime cannot satisfy both slots.
 */
export function selectParentSlimeInstances(
  ownedSlimes: Slime[],
  slotASpeciesId: string,
  slotBSpeciesId: string
): SelectedFusionParents | null {
  const pool = [...ownedSlimes];
  const slimeA = pool.find((s) => s.speciesId === slotASpeciesId);
  if (!slimeA) return null;

  const idx = pool.findIndex((s) => s.id === slimeA.id);
  if (idx >= 0) pool.splice(idx, 1);

  const slimeB = pool.find((s) => s.speciesId === slotBSpeciesId);
  if (!slimeB) return null;

  return { slimeA, slimeB };
}

// --- Result slime ---
//
// Flow: map chosen rule → new collection instance (standard variant until roll system exists).

/** Mint one fusion offspring slime (not yet written to SQLite). */
export function createFusionResultSlime(resultSpeciesId: string): Slime {
  return {
    id: `slime_${Date.now()}_${randomShortId()}`,
    speciesId: resultSpeciesId,
    variant: rollSlimeVariant(),
    level: initialSlimeLevel(),
    equippedNights: 0,
    seed: generateSlimeSeed(),
    acquiredAt: Date.now(),
    source: 'fusion',
  };
}

async function persistFusion(
  consumedSlimeIds: [string, string],
  newSlime: Slime
): Promise<void> {
  await Promise.all([
    deleteSlime(consumedSlimeIds[0]),
    deleteSlime(consumedSlimeIds[1]),
    insertSlime(newSlime),
  ]);
}

// --- Fusion orchestration ---
//
// Flow: validate recipe → choose rule + result species → select parents → create result →
// persist. Caller spends candies and updates Zustand collection store.

/**
 * Run a fusion attempt for the current slot selection.
 * Does not spend candies — the screen should call `useCandiesStore.spend` first.
 */
export async function performFusion(
  params: PerformFusionParams
): Promise<PerformFusionResult> {
  const { rulesForPair, ownedSlimes, slotASpeciesId, slotBSpeciesId, speciesById } = params;

  if (rulesForPair.length === 0) {
    return { ok: false, reason: 'no_recipe', message: 'No recipe for this pair.' };
  }

  const candyCost = getFusionCandyCost(rulesForPair);
  const chosenRule = chooseFusionRule(rulesForPair);
  const resultSpecies = speciesById[chosenRule.resultSpeciesId];
  if (!resultSpecies) {
    return {
      ok: false,
      reason: 'missing_result_species',
      message: `Missing result species: ${chosenRule.resultSpeciesId}`,
    };
  }

  const parents = selectParentSlimeInstances(ownedSlimes, slotASpeciesId, slotBSpeciesId);
  if (!parents) {
    const reason: FusionFailureReason = !ownedSlimes.some((s) => s.speciesId === slotASpeciesId)
      ? 'missing_parent_a'
      : 'missing_parent_b';
    return { ok: false, reason, message: 'No slime instance for one or both slots.' };
  }

  const newSlime = createFusionResultSlime(resultSpecies.id);
  const consumedSlimeIds: [string, string] = [parents.slimeA.id, parents.slimeB.id];

  try {
    await persistFusion(consumedSlimeIds, newSlime);
  } catch (e) {
    console.warn('persistFusion failed', e);
    throw e;
  }

  return {
    ok: true,
    candyCost,
    chosenRule,
    resultSpecies,
    consumedSlimeIds,
    newSlime,
  };
}
