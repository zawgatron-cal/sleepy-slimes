import { SLIME_VARIANT_LABELS, SlimeVariant } from '@/src/constants/game';
import type { Slime, Species } from '@/src/types';
import { getSlimeDisplayName } from '@/src/utils/slimeDisplayName';

/** Lower = consumed first when multiple instances share a species. */
const VARIANT_FUSE_PRIORITY: Record<SlimeVariant, number> = {
  [SlimeVariant.STANDARD]: 0,
  [SlimeVariant.PRISMATIC]: 1,
  [SlimeVariant.EXOTIC]: 2,
  [SlimeVariant.GOLD]: 3,
};

export function requiresFusionConfirmation(slime: Slime): boolean {
  return slime.variant !== SlimeVariant.STANDARD || slime.level > 1;
}

export function compareFusionConsumptionPriority(a: Slime, b: Slime): number {
  const variantDiff = VARIANT_FUSE_PRIORITY[a.variant] - VARIANT_FUSE_PRIORITY[b.variant];
  if (variantDiff !== 0) return variantDiff;

  const levelDiff = a.level - b.level;
  if (levelDiff !== 0) return levelDiff;

  const acquiredDiff = a.acquiredAt - b.acquiredAt;
  if (acquiredDiff !== 0) return acquiredDiff;

  return a.id.localeCompare(b.id);
}

/** Prefer standard, low-level instances when a species has duplicates. */
export function sortSlimesForFusionConsumption(slimes: Slime[]): Slime[] {
  return [...slimes].sort(compareFusionConsumptionPriority);
}

export function describeFusionSlimeWarning(
  slime: Slime,
  species?: Species | null
): string {
  const name = getSlimeDisplayName(slime, species);
  const traits: string[] = [];
  if (slime.variant !== SlimeVariant.STANDARD) {
    traits.push(SLIME_VARIANT_LABELS[slime.variant]);
  }
  if (slime.level > 1) {
    traits.push(`Level ${slime.level}`);
  }
  return traits.length > 0 ? `${name} (${traits.join(', ')})` : name;
}

export function buildFusionConfirmationMessage(
  entries: Array<{ slime: Slime; species?: Species | null }>
): string | null {
  const lines = entries
    .filter(({ slime }) => requiresFusionConfirmation(slime))
    .map(({ slime, species }) => `• ${describeFusionSlimeWarning(slime, species)}`);

  if (lines.length === 0) return null;

  return `This fusion will permanently consume:\n\n${lines.join('\n')}\n\nContinue anyway?`;
}
