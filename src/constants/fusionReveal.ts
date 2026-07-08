import { SlimeVariant, Tier, type SlimeVariant as SlimeVariantType, type Tier as TierType } from '@/src/constants/game';
import {
  isSpecialVariantReveal,
  resolveVariantRevealLevel,
  usesVariantSilhouetteStarTease,
  VARIANT_DUPLICATE_ANTICIPATION_MS,
  VARIANT_REVEAL_FLASH_MULTIPLIER,
  VARIANT_SILHOUETTE_REVEAL_MS,
} from '@/src/constants/sleepVariantReveal';

export const FUSION_MERGE_MS = 420;
export const FUSION_NEW_SPECIES_MERGE_MS = 780;
export const FUSION_HANDOFF_MS = 420;
/** Start silhouette handoff while parent swirl is still finishing (0–1 of swirl duration). */
export const FUSION_SILHOUETTE_HANDOFF_START_RATIO = 0.66;
export const FUSION_SILHOUETTE_REVEAL_MS = 520;
export const FUSION_BOUNCE_MS = 1040;
export const FUSION_META_MS = 360;
export const FUSION_NEW_BADGE_DELAY_MS = 380;
export const FUSION_NEW_BADGE_FADE_MS = 280;
export const FUSION_CTA_DELAY_MS = 180;

const FUSION_ANTICIPATION_MS: Record<TierType, number> = {
  [Tier.COMMON]: 560,
  [Tier.UNCOMMON]: 680,
  [Tier.RARE]: 820,
  [Tier.ULTRA_RARE]: 1100,
  [Tier.LEGENDARY]: 1380,
};

export function resolveFusionMergeMs(isNewSpecies: boolean): number {
  return isNewSpecies ? FUSION_NEW_SPECIES_MERGE_MS : FUSION_MERGE_MS;
}

export const FUSION_SWIRL_MS = 900;
export const FUSION_DUP_SWIRL_MS = 680;

export function resolveFusionSwirlMs(isNewSpecies: boolean): number {
  return isNewSpecies ? FUSION_SWIRL_MS : FUSION_DUP_SWIRL_MS;
}

export function resolveFusionAnticipationMs(tier: TierType, isNewSpecies: boolean): number {
  if (!isNewSpecies) return 0;
  return FUSION_ANTICIPATION_MS[tier] ?? 560;
}

/** Extra silhouette hold when rolling a non-standard variant on a new species fusion. */
export const FUSION_VARIANT_ANTICIPATION_BONUS_MS = 320;

export function shouldShowFusionRevealVariant(variant?: SlimeVariantType): boolean {
  return variant != null && variant !== SlimeVariant.STANDARD;
}

export function usesFusionVariantSilhouetteTease(variant?: SlimeVariantType): boolean {
  return usesVariantSilhouetteStarTease(variant);
}

export function usesFusionSilhouetteAnticipation(
  isNewSpecies: boolean,
  variant?: SlimeVariantType
): boolean {
  return isNewSpecies || isSpecialVariantReveal(variant);
}

export function resolveFusionVariantAnticipationMs(
  tier: TierType,
  isNewSpecies: boolean,
  variant?: SlimeVariantType
): number {
  if (isNewSpecies) {
    const base = resolveFusionAnticipationMs(tier, true);
    return isSpecialVariantReveal(variant) ? base + FUSION_VARIANT_ANTICIPATION_BONUS_MS : base;
  }
  if (isSpecialVariantReveal(variant)) {
    return VARIANT_DUPLICATE_ANTICIPATION_MS;
  }
  return 0;
}

export function resolveFusionSilhouetteRevealMs(variant?: SlimeVariantType): number {
  return usesFusionVariantSilhouetteTease(variant)
    ? VARIANT_SILHOUETTE_REVEAL_MS
    : FUSION_SILHOUETTE_REVEAL_MS;
}

export function resolveFusionFlashPeak(basePeak: number, variant?: SlimeVariantType): number {
  return basePeak * VARIANT_REVEAL_FLASH_MULTIPLIER[resolveVariantRevealLevel(variant)];
}

export type FusionParentSwirlPath = {
  inputRange: number[];
  parentA: { x: number[]; y: number[]; rotate: string[] };
  parentB: { x: number[]; y: number[]; rotate: string[] };
  scale: number[];
};

const radToDeg = (rad: number) => `${(rad * 180) / Math.PI}deg`;

/** Opposite-orbit spiral: parents chase each other inward around a shared center. */
export function buildFusionParentSwirlPath(
  startRadius: number,
  turns = 2.75,
  steps = 17
): FusionParentSwirlPath {
  const inputRange: number[] = [];
  const parentA = { x: [] as number[], y: [] as number[], rotate: [] as string[] };
  const parentB = { x: [] as number[], y: [] as number[], rotate: [] as string[] };
  const scale: number[] = [];

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    inputRange.push(t);

    const angularT = t ** 1.42;
    const radius = startRadius * (1 - t);
    const thetaA = Math.PI + angularT * turns * Math.PI * 2;
    const thetaB = thetaA + Math.PI;
    const spin = angularT * turns * Math.PI * 2;

    parentA.x.push(radius * Math.cos(thetaA));
    parentA.y.push(radius * Math.sin(thetaA));
    parentB.x.push(radius * Math.cos(thetaB));
    parentB.y.push(radius * Math.sin(thetaB));
    parentA.rotate.push(radToDeg(spin));
    parentB.rotate.push(radToDeg(spin));
    scale.push(0.22 + 0.78 * (1 - t));
  }

  return { inputRange, parentA, parentB, scale };
}

export type FusionFourParentOrbitPath = {
  inputRange: number[];
  parents: Array<{ x: number[]; y: number[]; rotate: string[] }>;
  scale: number[];
};

/** Four parents orbit a shared center and spiral inward. */
export function buildFusionFourParentOrbitPath(
  startRadius: number,
  parentCount = 4,
  turns = 2.5,
  steps = 17
): FusionFourParentOrbitPath {
  const inputRange: number[] = [];
  const parents = Array.from({ length: parentCount }, () => ({
    x: [] as number[],
    y: [] as number[],
    rotate: [] as string[],
  }));
  const scale: number[] = [];

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    inputRange.push(t);

    const angularT = t ** 1.35;
    const radius = startRadius * (1 - t);
    const orbitAngle = angularT * turns * Math.PI * 2;
    const spin = angularT * turns * Math.PI * 2;

    for (let p = 0; p < parentCount; p++) {
      const baseAngle = (p / parentCount) * Math.PI * 2 - Math.PI / 2;
      const theta = baseAngle + orbitAngle;

      parents[p].x.push(radius * Math.cos(theta));
      parents[p].y.push(radius * Math.sin(theta));
      parents[p].rotate.push(radToDeg(spin));
    }
    scale.push(0.2 + 0.72 * (1 - t));
  }

  return { inputRange, parents, scale };
}

export const FUSION_FOUR_PARENT_SWIRL_MS = 1100;

export function resolveFusionFourParentSwirlMs(isNewSpecies: boolean): number {
  return isNewSpecies ? FUSION_FOUR_PARENT_SWIRL_MS : FUSION_DUP_SWIRL_MS;
}
