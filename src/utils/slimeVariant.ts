import {
  DEFAULT_SLIME_VARIANT,
  SLIME_VARIANT_DROP_TABLE,
  SlimeVariant,
} from '@/src/constants/game';
import { pickWeightedIndex } from '@/src/utils/util';

const VALID = new Set<string>(Object.values(SlimeVariant));

const DROP_VARIANTS = SLIME_VARIANT_DROP_TABLE.map((row) => row.variant);
const DROP_WEIGHTS = SLIME_VARIANT_DROP_TABLE.map((row) => row.weight);

export function isSlimeVariant(value: string): value is SlimeVariant {
  return VALID.has(value);
}

export function parseSlimeVariant(value: string | null | undefined): SlimeVariant {
  if (value != null && isSlimeVariant(value)) return value;
  return DEFAULT_SLIME_VARIANT;
}

export type VariantDropBonus = {
  prismaticPercentAdd?: number;
  exoticPercentAdd?: number;
};

function weightsWithVariantBonus(bonus?: VariantDropBonus): number[] {
  if (!bonus) return [...DROP_WEIGHTS];
  const w = [...DROP_WEIGHTS];
  // Table uses 10_000 basis points (= 100%); +1% ⇒ +100 weight.
  if (bonus.prismaticPercentAdd) w[1] += bonus.prismaticPercentAdd * 100;
  if (bonus.exoticPercentAdd) w[2] += bonus.exoticPercentAdd * 100;
  return w;
}

/**
 * Roll one cosmetic variant (Standard / Prismatic / Exotic / Gold) for a new slime instance.
 * Used by sleep spawns and fusion results.
 */
export function rollSlimeVariant(bonus?: VariantDropBonus): SlimeVariant {
  const weights = weightsWithVariantBonus(bonus);
  const idx = pickWeightedIndex(weights);
  return DROP_VARIANTS[idx] ?? DEFAULT_SLIME_VARIANT;
}
