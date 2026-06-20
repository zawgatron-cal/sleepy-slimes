/**
 * Equipped slime level rewards — lookup + apply helpers.
 * Values: `src/constants/equippedSlimeLevelRewards.ts`
 */

import { Tier, type Tier as TierType, type SpawnableTier } from '@/src/constants/game';
import type { SlimeLevel } from '@/src/constants/game';
import {
  COMMON_CANDY_PERCENT_MORE,
  LEGENDARY_EXOTIC_PERCENT,
  LEGENDARY_EXTRA_SLIME_ROLL_PERCENT,
  LEGENDARY_FUSION_CANDY_PERCENT_OFF,
  LEGENDARY_SLEEP_QUALITY_FLOOR,
  LEGENDARY_ULTRA_RARE_SPAWN_PERCENT,
  RARE_SPAWN_RARE_PERCENT,
  RARE_SPAWN_ULTRA_PERCENT,
  UNCOMMON_EXTRA_SLIME_ROLL_PERCENT,
  ULTRA_RARE_EXOTIC_PERCENT,
  ULTRA_RARE_PRISMATIC_PERCENT,
} from '@/src/constants/equippedSlimeLevelRewards';
import type { VariantDropBonus } from '@/src/utils/slimeVariant';
import { parseSlimeLevel } from '@/src/utils/slimeLevel';

/** Normalized bonuses applied during sleep (zeros = inactive). */
export type EquippedSlimeBonus = {
  /** Additive % on candy payout (5 ⇒ 5% more candies). */
  candyPercentMore: number;
  /** 0–1 chance to roll one extra slime this session. */
  extraSlimeRollChance: number;
  /** Percentage points added to zone Rare tier weight before renormalize. */
  rareSpawnPercentAdd: number;
  ultraRareSpawnPercentAdd: number;
  /** Percentage points added to variant drop weights (prismatic / exotic). */
  prismaticVariantPercentAdd: number;
  exoticVariantPercentAdd: number;
  /** Minimum sleep quality score when equipped (0 = no floor). */
  sleepQualityFloor: number;
  /** Percent off fusion candy cost (30 ⇒ pay 70%). */
  fusionCandyCostPercentOff: number;
};

export const EMPTY_EQUIPPED_SLIME_BONUS: EquippedSlimeBonus = {
  candyPercentMore: 0,
  extraSlimeRollChance: 0,
  rareSpawnPercentAdd: 0,
  ultraRareSpawnPercentAdd: 0,
  prismaticVariantPercentAdd: 0,
  exoticVariantPercentAdd: 0,
  sleepQualityFloor: 0,
  fusionCandyCostPercentOff: 0,
};

function valueAtLevel(values: readonly number[], level: SlimeLevel): number {
  return values[level - 1] ?? 0;
}

/**
 * Bonuses for the equipped slime at its current level and species tier.
 * Change reward *shape* per tier in the switch below; change numbers in the constants file.
 */
export function getEquippedSlimeBonus(tier: TierType, level: SlimeLevel): EquippedSlimeBonus {
  const lvl = parseSlimeLevel(level);

  switch (tier) {
    case Tier.COMMON:
      return {
        ...EMPTY_EQUIPPED_SLIME_BONUS,
        candyPercentMore: valueAtLevel(COMMON_CANDY_PERCENT_MORE, lvl),
      };
    case Tier.UNCOMMON:
      return {
        ...EMPTY_EQUIPPED_SLIME_BONUS,
        extraSlimeRollChance: valueAtLevel(UNCOMMON_EXTRA_SLIME_ROLL_PERCENT, lvl) / 100,
      };
    case Tier.RARE:
      return {
        ...EMPTY_EQUIPPED_SLIME_BONUS,
        rareSpawnPercentAdd: valueAtLevel(RARE_SPAWN_RARE_PERCENT, lvl),
        ultraRareSpawnPercentAdd: valueAtLevel(RARE_SPAWN_ULTRA_PERCENT, lvl),
      };
    case Tier.ULTRA_RARE:
      return {
        ...EMPTY_EQUIPPED_SLIME_BONUS,
        prismaticVariantPercentAdd: valueAtLevel(ULTRA_RARE_PRISMATIC_PERCENT, lvl),
        exoticVariantPercentAdd: valueAtLevel(ULTRA_RARE_EXOTIC_PERCENT, lvl),
      };
    case Tier.LEGENDARY: {
      return {
        ...EMPTY_EQUIPPED_SLIME_BONUS,
        extraSlimeRollChance: valueAtLevel(LEGENDARY_EXTRA_SLIME_ROLL_PERCENT, lvl) / 100,
        sleepQualityFloor: valueAtLevel(LEGENDARY_SLEEP_QUALITY_FLOOR, lvl),
        fusionCandyCostPercentOff: valueAtLevel(LEGENDARY_FUSION_CANDY_PERCENT_OFF, lvl),
        ultraRareSpawnPercentAdd: valueAtLevel(LEGENDARY_ULTRA_RARE_SPAWN_PERCENT, lvl),
        exoticVariantPercentAdd: valueAtLevel(LEGENDARY_EXOTIC_PERCENT, lvl),
      };
    }
    default:
      return { ...EMPTY_EQUIPPED_SLIME_BONUS };
  }
}

/** Variant roll bonus from equipped buddy (prismatic / exotic weight adds). */
export function equippedVariantDropBonus(
  equipped: EquippedSlimeBonus
): VariantDropBonus | undefined {
  if (
    equipped.prismaticVariantPercentAdd <= 0 &&
    equipped.exoticVariantPercentAdd <= 0
  ) {
    return undefined;
  }
  return {
    prismaticPercentAdd: equipped.prismaticVariantPercentAdd || undefined,
    exoticPercentAdd: equipped.exoticVariantPercentAdd || undefined,
  };
}

/** Human-readable summary for UI / dev (matches design table wording). */
export function describeEquippedSlimeBonus(tier: TierType, level: SlimeLevel): string {
  const b = getEquippedSlimeBonus(tier, level);
  switch (tier) {
    case Tier.COMMON:
      return `${b.candyPercentMore}% more candies`;
    case Tier.UNCOMMON:
      return `${Math.round(b.extraSlimeRollChance * 100)}% chance for +1 slime roll`;
    case Tier.RARE: {
      const parts = [`Rare spawn chance +${b.rareSpawnPercentAdd}%`];
      if (b.ultraRareSpawnPercentAdd > 0) {
        parts.push(`Ultra Rare spawn chance +${b.ultraRareSpawnPercentAdd}%`);
      }
      return parts.join(', ');
    }
    case Tier.ULTRA_RARE: {
      const parts: string[] = [];
      if (b.prismaticVariantPercentAdd > 0) {
        parts.push(`Prismatic Rarity +${b.prismaticVariantPercentAdd}%`);
      }
      if (b.exoticVariantPercentAdd > 0) {
        parts.push(`Exotic +${b.exoticVariantPercentAdd}%`);
      }
      return parts.length > 0 ? parts.join(', ') : '—';
    }
    case Tier.LEGENDARY: {
      const parts: string[] = [];
      if (b.extraSlimeRollChance >= 1) {
        parts.push('Guaranteed +1 slime roll');
      }
      if (b.sleepQualityFloor > 0) {
        parts.push(`Sleep quality floor ${b.sleepQualityFloor}`);
      }
      if (b.fusionCandyCostPercentOff > 0) {
        parts.push(`Fusion cost ${b.fusionCandyCostPercentOff}% less`);
      }
      if (b.ultraRareSpawnPercentAdd > 0) {
        parts.push(`Ultra Rare spawn +${b.ultraRareSpawnPercentAdd}%`);
      }
      if (b.exoticVariantPercentAdd > 0) {
        parts.push(`Exotic +${b.exoticVariantPercentAdd}%`);
      }
      return parts.length > 0 ? parts.join(', ') : '—';
    }
    default:
      return '—';
  }
}

/** Apply candy % bonus after streak (multiplicative on current total). */
export function applyEquippedCandyBonus(candies: number, bonus: EquippedSlimeBonus): number {
  if (bonus.candyPercentMore <= 0) return candies;
  return Math.floor(candies * (1 + bonus.candyPercentMore / 100));
}

/** Maybe add +1 slime count from equipped Uncommon / Legendary bonus. */
export function applyEquippedExtraSlimeRoll(
  slimeCount: number,
  maxSlimes: number,
  bonus: EquippedSlimeBonus
): number {
  if (bonus.extraSlimeRollChance <= 0) return slimeCount;
  if (slimeCount >= maxSlimes) return slimeCount;
  if (Math.random() < bonus.extraSlimeRollChance) {
    return Math.min(maxSlimes, slimeCount + 1);
  }
  return slimeCount;
}

/** Raise sleep quality to equipped buddy floor when active. */
export function applySleepQualityFloor(score: number, bonus: EquippedSlimeBonus): number {
  if (bonus.sleepQualityFloor <= 0) return score;
  return Math.max(score, bonus.sleepQualityFloor);
}

/** Apply equipped fusion candy discount (floors at 0). */
export function applyEquippedFusionCandyDiscount(
  baseCost: number,
  bonus: EquippedSlimeBonus
): number {
  if (bonus.fusionCandyCostPercentOff <= 0 || baseCost <= 0) return baseCost;
  return Math.max(
    0,
    Math.floor(baseCost * (1 - bonus.fusionCandyCostPercentOff / 100))
  );
}

/** Add rare / ultra spawn percentage points, then renormalize to sum 100. */
export function applyEquippedTierSpawnBonus(
  zoneRarity: Record<SpawnableTier, number>,
  bonus: EquippedSlimeBonus
): Record<SpawnableTier, number> {
  if (bonus.rareSpawnPercentAdd <= 0 && bonus.ultraRareSpawnPercentAdd <= 0) {
    return zoneRarity;
  }

  const adjusted: Record<SpawnableTier, number> = {
    [Tier.COMMON]: zoneRarity[Tier.COMMON],
    [Tier.UNCOMMON]: zoneRarity[Tier.UNCOMMON],
    [Tier.RARE]: zoneRarity[Tier.RARE] + bonus.rareSpawnPercentAdd,
    [Tier.ULTRA_RARE]: zoneRarity[Tier.ULTRA_RARE] + bonus.ultraRareSpawnPercentAdd,
  };

  const sum = (Object.values(adjusted) as number[]).reduce((a, b) => a + b, 0);
  if (sum <= 0) return zoneRarity;

  return {
    [Tier.COMMON]: (adjusted[Tier.COMMON] / sum) * 100,
    [Tier.UNCOMMON]: (adjusted[Tier.UNCOMMON] / sum) * 100,
    [Tier.RARE]: (adjusted[Tier.RARE] / sum) * 100,
    [Tier.ULTRA_RARE]: (adjusted[Tier.ULTRA_RARE] / sum) * 100,
  };
}
