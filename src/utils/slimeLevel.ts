import {
  DEFAULT_SLIME_LEVEL,
  MAX_SLIME_LEVEL,
  MIN_SLIME_LEVEL,
  type SlimeLevel,
} from '@/src/constants/game';
import type { Slime } from '@/src/types';

export type { SlimeLevel } from '@/src/constants/game';

const LEVELS: readonly SlimeLevel[] = [1, 2, 3, 4, 5];

export function isSlimeLevel(value: number): value is SlimeLevel {
  return Number.isInteger(value) && value >= MIN_SLIME_LEVEL && value <= MAX_SLIME_LEVEL;
}

export function parseSlimeLevel(value: number | string | null | undefined): SlimeLevel {
  const n = typeof value === 'string' ? parseInt(value, 10) : value;
  if (n != null && isSlimeLevel(n)) return n;
  return DEFAULT_SLIME_LEVEL;
}

/** Level assigned to every new slime from sleep or fusion. */
export function initialSlimeLevel(): SlimeLevel {
  return DEFAULT_SLIME_LEVEL;
}

export function canRaiseSlimeLevel(level: SlimeLevel): boolean {
  return level < MAX_SLIME_LEVEL;
}

/** Next level, or null if already at max. */
export function nextSlimeLevel(level: SlimeLevel): SlimeLevel | null {
  if (!canRaiseSlimeLevel(level)) return null;
  return (level + 1) as SlimeLevel;
}

/** Copy of a slime at the next level (no persistence). */
export function withRaisedSlimeLevel(slime: Slime): Slime | null {
  const level = nextSlimeLevel(parseSlimeLevel(slime.level));
  if (level == null) return null;
  return { ...slime, level };
}

export function formatSlimeLevel(level: SlimeLevel): string {
  return `Lv.${level}`;
}

export const SLIME_LEVELS: readonly SlimeLevel[] = LEVELS;
