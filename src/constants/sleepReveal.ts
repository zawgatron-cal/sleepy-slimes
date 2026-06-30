import { SlimeVariant, Tier, type SlimeVariant as SlimeVariantType, type Tier as TierType } from '@/src/constants/game';

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
    anticipationMs: 720,
    revealMs: 420,
    popOvershoot: 1.06,
    glowStrength: 0.22,
    flashStrength: 0.08,
  },
  [Tier.UNCOMMON]: {
    anticipationMs: 920,
    revealMs: 480,
    popOvershoot: 1.08,
    glowStrength: 0.34,
    flashStrength: 0.14,
  },
  [Tier.RARE]: {
    anticipationMs: 1180,
    revealMs: 540,
    popOvershoot: 1.1,
    glowStrength: 0.48,
    flashStrength: 0.22,
  },
  [Tier.ULTRA_RARE]: {
    anticipationMs: 2800,
    revealMs: 680,
    popOvershoot: 1.16,
    glowStrength: 0.72,
    flashStrength: 0.38,
  },
  [Tier.LEGENDARY]: {
    anticipationMs: 1950,
    revealMs: 720,
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
  isNewSpecies: boolean
): boolean {
  return !isNewSpecies;
}

export function resolveSleepRevealConfig(
  tier: TierType,
  variant?: SlimeVariantType,
  isNewSpecies = false
): SleepRevealTierConfig & { anticipationMs: number } {
  const base = SLEEP_REVEAL_TIER_CONFIG[tier];
  if (shouldSkipSleepRevealAnticipation(tier, isNewSpecies)) {
    return { ...base, anticipationMs: 0 };
  }
  const variantBonus =
    variant != null && variant !== SlimeVariant.STANDARD
      ? SLEEP_REVEAL_VARIANT_ANTICIPATION_BONUS_MS
      : 0;
  return {
    ...base,
    anticipationMs: base.anticipationMs + variantBonus,
  };
}

export function shouldShowRevealVariant(variant?: SlimeVariantType): boolean {
  return variant != null && variant !== SlimeVariant.STANDARD;
}

/** New species — silhouette + tier tease instead of ? cover during anticipation. */
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
export const SLEEP_REVEAL_ULTRA_RARE_BOUNCE_MS = 1520;
export const SLEEP_REVEAL_SILHOUETTE_BOUNCE_MS = 1120;
/** Silhouette → full slime crossfade + pop. */
export const SLEEP_REVEAL_SILHOUETTE_REVEAL_MS = 540;
