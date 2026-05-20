import { MAX_SLIME_LEVEL, type SlimeLevel, type Tier } from '@/src/constants/game';
import {
  isLevelUpStepKey,
  SLIME_LEVEL_UP_REQUIREMENTS,
  type LevelUpRequirement,
} from '@/src/constants/slimeLevelRequirements';
import type { Slime } from '@/src/types';
import { canRaiseSlimeLevel, parseSlimeLevel } from '@/src/utils/slimeLevel';

export type SlimeLevelUpStatus = {
  atMaxLevel: boolean;
  canLevelUp: boolean;
  requirement: LevelUpRequirement | null;
  equippedNights: number;
  nightsRequired: number;
  nightsMet: boolean;
  candiesRequired: number;
  candiesMet: boolean;
  candyBalance: number;
  nextLevel: SlimeLevel | null;
};

export function parseEquippedNights(value: number | null | undefined): number {
  const n = value ?? 0;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** Requirement to go from `currentLevel` → currentLevel + 1 for this species tier. */
export function getLevelUpRequirement(
  tier: Tier,
  currentLevel: SlimeLevel
): LevelUpRequirement | null {
  if (!canRaiseSlimeLevel(currentLevel) || !isLevelUpStepKey(currentLevel)) {
    return null;
  }
  return SLIME_LEVEL_UP_REQUIREMENTS[tier][currentLevel];
}

/** Whether this slime meets nights + candy cost for the next level. */
export function evaluateSlimeLevelUp(
  slime: Slime,
  tier: Tier,
  candyBalance: number
): SlimeLevelUpStatus {
  const currentLevel = parseSlimeLevel(slime.level);
  const equippedNights = parseEquippedNights(slime.equippedNights);
  const atMaxLevel = !canRaiseSlimeLevel(currentLevel);
  const requirement = atMaxLevel ? null : getLevelUpRequirement(tier, currentLevel);
  const nextLevel = atMaxLevel ? null : ((currentLevel + 1) as SlimeLevel);

  if (!requirement) {
    return {
      atMaxLevel,
      canLevelUp: false,
      requirement: null,
      equippedNights,
      nightsRequired: 0,
      nightsMet: false,
      candiesRequired: 0,
      candiesMet: false,
      candyBalance,
      nextLevel,
    };
  }

  const nightsMet = equippedNights >= requirement.nights;
  const candiesMet = candyBalance >= requirement.candies;

  return {
    atMaxLevel,
    canLevelUp: nightsMet && candiesMet,
    requirement,
    equippedNights,
    nightsRequired: requirement.nights,
    nightsMet,
    candiesRequired: requirement.candies,
    candiesMet,
    candyBalance,
    nextLevel,
  };
}
