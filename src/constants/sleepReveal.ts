import { SlimeVariant, Tier, type SlimeVariant as SlimeVariantType, type Tier as TierType } from '@/src/constants/game';
import {
  resolveVariantRevealLevel,
  VARIANT_DUPLICATE_ANTICIPATION_MS,
  VARIANT_REVEAL_FLASH_MULTIPLIER,
  isSpecialVariantReveal,
} from '@/src/constants/sleepVariantReveal';

export type SleepRevealTierConfig = {
  /** Hold before slime appears. */
  anticipationMs: number;
  /** Pop-in duration feel (used for spring + flash). */
  revealMs: number;
  /** Peak scale during pop. */
  popOvershoot: number;
  /** Tier glow behind card (0–1). */
  glowStrength: number;
  /** Brief white/tier flash on reveal (0–1). */
  flashStrength: number;
};

export const SLEEP_REVEAL_TIER_CONFIG: Record<TierType, SleepRevealTierConfig> = {
  [Tier.COMMON]: {
    anticipationMs: 420,
    revealMs: 360,
    popOvershoot: 1.06,
    glowStrength: 0.22,
    flashStrength: 0.08,
  },
  [Tier.UNCOMMON]: {
    anticipationMs: 560,
    revealMs: 400,
    popOvershoot: 1.08,
    glowStrength: 0.34,
    flashStrength: 0.14,
  },
  [Tier.RARE]: {
    anticipationMs: 720,
    revealMs: 460,
    popOvershoot: 1.1,
    glowStrength: 0.48,
    flashStrength: 0.22,
  },
  [Tier.ULTRA_RARE]: {
    anticipationMs: 1600,
    revealMs: 560,
    popOvershoot: 1.16,
    glowStrength: 0.72,
    flashStrength: 0.38,
  },
  [Tier.LEGENDARY]: {
    anticipationMs: 1200,
    revealMs: 580,
    popOvershoot: 1.18,
    glowStrength: 0.78,
    flashStrength: 0.42,
  },
};

/** Extra suspense when rolling a non-standard variant. */
export const SLEEP_REVEAL_VARIANT_ANTICIPATION_BONUS_MS = 320;

/** Fast peel for duplicate common / uncommon (no ? hold). */
export const SLEEP_REVEAL_QUICK_COVER_MS = 200;
export const SLEEP_REVEAL_QUICK_META_MS = 220;
export const SLEEP_REVEAL_QUICK_CTA_DELAY_MS = 140;
export const SLEEP_REVEAL_QUICK_FLASH_SCALE = 0.45;

export function shouldSkipSleepRevealAnticipation(
  _tier: TierType,
  isNewSpecies: boolean,
  variant?: SlimeVariantType
): boolean {
  if (isSpecialVariantReveal(variant)) return false;
  return !isNewSpecies;
}

export function resolveSleepRevealConfig(
  tier: TierType,
  variant?: SlimeVariantType,
  isNewSpecies = false
): SleepRevealTierConfig & { anticipationMs: number } {
  const base = SLEEP_REVEAL_TIER_CONFIG[tier];
  const variantLevel = resolveVariantRevealLevel(variant);

  if (shouldSkipSleepRevealAnticipation(tier, isNewSpecies, variant)) {
    return { ...base, anticipationMs: 0 };
  }

  if (!isNewSpecies && isSpecialVariantReveal(variant)) {
    const duplicateLevel = resolveVariantRevealLevel(variant);
    if (duplicateLevel !== 'standard') {
      return {
        ...base,
        anticipationMs: VARIANT_DUPLICATE_ANTICIPATION_MS,
        flashStrength: base.flashStrength * VARIANT_REVEAL_FLASH_MULTIPLIER[duplicateLevel],
      };
    }
  }

  const variantBonus =
    variant != null && variant !== SlimeVariant.STANDARD
      ? SLEEP_REVEAL_VARIANT_ANTICIPATION_BONUS_MS
      : 0;
  return {
    ...base,
    anticipationMs: base.anticipationMs + variantBonus,
    flashStrength: base.flashStrength * VARIANT_REVEAL_FLASH_MULTIPLIER[variantLevel],
  };
}

export function shouldShowRevealVariant(variant?: SlimeVariantType): boolean {
  return variant != null && variant !== SlimeVariant.STANDARD;
}

/** New species — silhouette tease during anticipation. */
export function usesSilhouetteSleepRevealAnticipation(
  _tier: TierType,
  isNewSpecies: boolean
): boolean {
  return isNewSpecies;
}

export function usesUltraRareRevealAmbience(tier: TierType, isQuickReveal: boolean): boolean {
  return tier === Tier.ULTRA_RARE && !isQuickReveal;
}

/** Smooth vertical bounce on the silhouette during Ultra Rare anticipation. */
export const SLEEP_REVEAL_ULTRA_RARE_BOUNCE_MS = 900;
export const SLEEP_REVEAL_SILHOUETTE_BOUNCE_MS = 640;
/** Silhouette → full slime crossfade + pop. */
export const SLEEP_REVEAL_SILHOUETTE_REVEAL_MS = 420;
