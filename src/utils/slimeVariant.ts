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

/**
 * Roll one cosmetic variant (Standard / Prismatic / Exotic / Gold) for a new slime instance.
 * Used by sleep spawns and fusion results.
 */
export function rollSlimeVariant(): SlimeVariant {
  const idx = pickWeightedIndex(DROP_WEIGHTS);
  return DROP_VARIANTS[idx] ?? DEFAULT_SLIME_VARIANT;
}
