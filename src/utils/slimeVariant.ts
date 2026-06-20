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
  goldPercentAdd?: number;
};

const VARIANT_INDEX = {
  standard: 0,
  prismatic: 1,
  exotic: 2,
  gold: 3,
} as const;

export function mergeVariantDropBonus(
  ...bonuses: (VariantDropBonus | undefined)[]
): VariantDropBonus | undefined {
  let prismatic = 0;
  let exotic = 0;
  let gold = 0;
  for (const b of bonuses) {
    if (!b) continue;
    prismatic += b.prismaticPercentAdd ?? 0;
    exotic += b.exoticPercentAdd ?? 0;
    gold += b.goldPercentAdd ?? 0;
  }
  if (prismatic === 0 && exotic === 0 && gold === 0) return undefined;
  return {
    ...(prismatic > 0 ? { prismaticPercentAdd: prismatic } : {}),
    ...(exotic > 0 ? { exoticPercentAdd: exotic } : {}),
    ...(gold > 0 ? { goldPercentAdd: gold } : {}),
  };
}

function weightsWithVariantBonus(bonus?: VariantDropBonus): number[] {
  if (!bonus) return [...DROP_WEIGHTS];
  const w = [...DROP_WEIGHTS];
  // Table uses 10_000 basis points (= 100%); +1% ⇒ +100 weight.
  if (bonus.prismaticPercentAdd) {
    w[VARIANT_INDEX.prismatic] += bonus.prismaticPercentAdd * 100;
  }
  if (bonus.exoticPercentAdd) {
    w[VARIANT_INDEX.exotic] += bonus.exoticPercentAdd * 100;
  }
  if (bonus.goldPercentAdd) {
    w[VARIANT_INDEX.gold] += bonus.goldPercentAdd * 100;
  }
  return w;
}

/** Effective drop % per variant (optional bonus from buddy, secret stats, etc.). */
export function getVariantDropPercentages(
  bonus?: VariantDropBonus
): Record<SlimeVariant, number> {
  const weights = weightsWithVariantBonus(bonus);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const percentages = {} as Record<SlimeVariant, number>;
  for (let i = 0; i < DROP_VARIANTS.length; i += 1) {
    const variant = DROP_VARIANTS[i] ?? DEFAULT_SLIME_VARIANT;
    percentages[variant] = total > 0 ? (weights[i]! / total) * 100 : 0;
  }
  return percentages;
}

export function formatVariantDropPct(variant: SlimeVariant, pct: number): string {
  if (variant === SlimeVariant.GOLD) return `${pct.toFixed(4)}%`;
  if (variant === SlimeVariant.EXOTIC) return `${pct.toFixed(3)}%`;
  return `${pct.toFixed(2)}%`;
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
