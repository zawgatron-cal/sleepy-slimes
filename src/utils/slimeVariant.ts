import { DEFAULT_SLIME_VARIANT, SlimeVariant } from '@/src/constants/game';

const VALID = new Set<string>(Object.values(SlimeVariant));

export function isSlimeVariant(value: string): value is SlimeVariant {
  return VALID.has(value);
}

export function parseSlimeVariant(value: string | null | undefined): SlimeVariant {
  if (value != null && isSlimeVariant(value)) return value;
  return DEFAULT_SLIME_VARIANT;
}
