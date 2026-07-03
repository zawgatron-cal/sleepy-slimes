import { SlimeVariant, type SlimeVariant as SlimeVariantType } from '@/src/constants/game';

export type VariantRevealLevel = 'standard' | 'prismatic' | 'exotic' | 'gold';

export function resolveVariantRevealLevel(variant?: SlimeVariantType): VariantRevealLevel {
  switch (variant) {
    case SlimeVariant.GOLD:
      return 'gold';
    case SlimeVariant.EXOTIC:
      return 'exotic';
    case SlimeVariant.PRISMATIC:
      return 'prismatic';
    default:
      return 'standard';
  }
}

export function isSpecialVariantReveal(variant?: SlimeVariantType): boolean {
  return resolveVariantRevealLevel(variant) !== 'standard';
}

/** All non-standard variants get silhouette star tease + hold (even duplicates). */
export function usesVariantRevealAnticipation(variant?: SlimeVariantType): boolean {
  return isSpecialVariantReveal(variant);
}

export function usesVariantSilhouetteStarTease(variant?: SlimeVariantType): boolean {
  return isSpecialVariantReveal(variant);
}

/** Extra pause before the CTA unlocks after the slime is revealed. */
export const VARIANT_REVEAL_CTA_EXTRA_DELAY_MS: Record<VariantRevealLevel, number> = {
  standard: 0,
  prismatic: 420,
  exotic: 780,
  gold: 1100,
};

/** One grow/shrink pulse on the tease star. */
export const VARIANT_STAR_PULSE_MS = 680;

/** Single colored star tease — same timing for every special variant. */
export const VARIANT_STAR_TEASE_MS = VARIANT_STAR_PULSE_MS;

/** Brief silhouette pause after the star tease, before reveal crossfade. */
export const VARIANT_STAR_TEASE_FINISH_BEAT_MS = 160;

/** Duplicate special-variant hold — identical across prismatic / exotic / gold. */
export const VARIANT_DUPLICATE_ANTICIPATION_MS =
  VARIANT_STAR_TEASE_MS + VARIANT_STAR_TEASE_FINISH_BEAT_MS;

export const VARIANT_SILHOUETTE_REVEAL_MS = 920;

export const VARIANT_MAIN_STAR_SIZE = 64;
export const VARIANT_ACCENT_STAR_SIZE = 16;

export const VARIANT_STAR_FLASH_TINT: Record<
  Exclude<VariantRevealLevel, 'standard'>,
  string
> = {
  prismatic: '#FFFFFF',
  exotic: '#00FFF0',
  gold: '#F5D060',
};

export function resolveVariantStarFlashTint(level: VariantRevealLevel): string {
  if (level === 'standard') return VARIANT_STAR_FLASH_TINT.prismatic;
  return VARIANT_STAR_FLASH_TINT[level];
}

export const VARIANT_REVEAL_FLASH_MULTIPLIER: Record<VariantRevealLevel, number> = {
  standard: 1,
  prismatic: 1.12,
  exotic: 1.32,
  gold: 1.55,
};
