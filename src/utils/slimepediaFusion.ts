import type { FusionCompletionRecord } from '@/src/db';
import type { FusionRule } from '@/src/types';
import { getSlimepediaFusionHint, type SlimepediaEntry } from '@/src/utils/slimepediaContent';

export type SlimepediaFusionRecipe = {
  parentAId: string;
  parentBId: string;
  resultId: string;
};

export type SlimepediaFusionItem =
  | { kind: 'portraits'; recipe: SlimepediaFusionRecipe }
  | { kind: 'unknown' }
  | { kind: 'hint'; text: string };

export type SlimepediaFusionDisplay =
  | { mode: 'visible'; items: SlimepediaFusionItem[] }
  | { mode: 'hidden' };

function recipeKey(parentAId: string, parentBId: string, resultId: string): string {
  const parents = [parentAId, parentBId].sort().join('+');
  return `${parents}=>${resultId}`;
}

function toRecipe(rule: FusionRule): SlimepediaFusionRecipe {
  return {
    parentAId: rule.parentSpeciesA,
    parentBId: rule.parentSpeciesB,
    resultId: rule.resultSpeciesId,
  };
}

/** Species ids that have participated in at least one completed fusion. */
export function getFusedSpeciesIds(completions: FusionCompletionRecord[]): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const completion of completions) {
    ids.add(completion.parentAId);
    ids.add(completion.parentBId);
    ids.add(completion.resultId);
  }
  return ids;
}

/** Recipes where `speciesId` is the fusion result (from SQLite `fusion_rules`). */
export function getInboundFusionRecipes(
  fusionRules: FusionRule[],
  speciesId: string
): SlimepediaFusionRecipe[] {
  return fusionRules
    .filter((rule) => rule.resultSpeciesId === speciesId)
    .map(toRecipe);
}

/** All fusion recipes involving `speciesId` (from SQLite `fusion_rules`). */
export function getAllFusionRecipesForSpecies(
  fusionRules: FusionRule[],
  speciesId: string
): SlimepediaFusionRecipe[] {
  const seen = new Set<string>();
  const recipes: SlimepediaFusionRecipe[] = [];

  for (const rule of fusionRules) {
    const involves =
      rule.resultSpeciesId === speciesId ||
      rule.parentSpeciesA === speciesId ||
      rule.parentSpeciesB === speciesId;
    if (!involves) continue;

    const recipe = toRecipe(rule);
    const key = recipeKey(recipe.parentAId, recipe.parentBId, recipe.resultId);
    if (seen.has(key)) continue;
    seen.add(key);
    recipes.push(recipe);
  }

  recipes.sort((a, b) => {
    const aInbound = a.resultId === speciesId ? 0 : 1;
    const bInbound = b.resultId === speciesId ? 0 : 1;
    if (aInbound !== bInbound) return aInbound - bInbound;
    return a.resultId.localeCompare(b.resultId);
  });

  return recipes;
}

/** Portrait recipes the player has completed involving `speciesId`. */
export function getCompletedRecipesForSpecies(
  completions: FusionCompletionRecord[],
  speciesId: string
): SlimepediaFusionRecipe[] {
  const seen = new Set<string>();
  const recipes: SlimepediaFusionRecipe[] = [];

  for (const completion of completions) {
    const involves =
      completion.resultId === speciesId ||
      completion.parentAId === speciesId ||
      completion.parentBId === speciesId;
    if (!involves) continue;

    const key = recipeKey(completion.parentAId, completion.parentBId, completion.resultId);
    if (seen.has(key)) continue;
    seen.add(key);

    recipes.push({
      parentAId: completion.parentAId,
      parentBId: completion.parentBId,
      resultId: completion.resultId,
    });
  }

  recipes.sort((a, b) => {
    const aInbound = a.resultId === speciesId ? 0 : 1;
    const bInbound = b.resultId === speciesId ? 0 : 1;
    if (aInbound !== bInbound) return aInbound - bInbound;
    return a.resultId.localeCompare(b.resultId);
  });

  return recipes;
}

function bothParentsDiscovered(
  recipe: SlimepediaFusionRecipe,
  everDiscoveredIds: ReadonlySet<string>
): boolean {
  return everDiscoveredIds.has(recipe.parentAId) && everDiscoveredIds.has(recipe.parentBId);
}

function resolveInboundRecipeItem(
  recipe: SlimepediaFusionRecipe,
  everDiscoveredIds: ReadonlySet<string>,
  slimepediaById: Record<string, SlimepediaEntry>
): SlimepediaFusionItem {
  if (everDiscoveredIds.has(recipe.resultId)) {
    return { kind: 'portraits', recipe };
  }
  if (!bothParentsDiscovered(recipe, everDiscoveredIds)) {
    return { kind: 'unknown' };
  }
  const hint = getSlimepediaFusionHint(slimepediaById[recipe.resultId]);
  return { kind: 'hint', text: hint ?? '???' };
}

/**
 * Fusion section for a species detail page.
 *
 * Result slimes: always show inbound recipes from `fusion_rules` (???, hint, or portrait).
 * Ingredient slimes: show portrait rows only after fusing with that slime and discovering the result.
 */
export function resolveSlimepediaFusionDisplay(
  speciesId: string,
  fusionCompletions: FusionCompletionRecord[],
  fusionRules: FusionRule[],
  everDiscoveredIds: ReadonlySet<string>,
  slimepediaById: Record<string, SlimepediaEntry>,
  devUnlockAllPortraits = false
): SlimepediaFusionDisplay {
  if (devUnlockAllPortraits) {
    const recipes = getAllFusionRecipesForSpecies(fusionRules, speciesId);
    if (recipes.length === 0) {
      return { mode: 'hidden' };
    }
    return {
      mode: 'visible',
      items: recipes.map((recipe) => ({ kind: 'portraits', recipe })),
    };
  }

  const items: SlimepediaFusionItem[] = [];
  const seen = new Set<string>();

  for (const recipe of getInboundFusionRecipes(fusionRules, speciesId)) {
    const key = recipeKey(recipe.parentAId, recipe.parentBId, recipe.resultId);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(resolveInboundRecipeItem(recipe, everDiscoveredIds, slimepediaById));
  }

  for (const recipe of getCompletedRecipesForSpecies(fusionCompletions, speciesId)) {
    if (recipe.resultId === speciesId) continue;
    if (!everDiscoveredIds.has(recipe.resultId)) continue;

    const key = recipeKey(recipe.parentAId, recipe.parentBId, recipe.resultId);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ kind: 'portraits', recipe });
  }

  if (items.length === 0) {
    return { mode: 'hidden' };
  }
  return { mode: 'visible', items };
}
