import { ZONES } from '@/src/data/zones';

/** Lockable zones — equal; candy cost depends on how many you've already unlocked. */
export const LOCKABLE_ZONE_IDS = [
  ZONES.THE_SEA.id,
  ZONES.FOREST_RUINS.id,
  ZONES.SLIME_CITY.id,
] as const;

export type LockableZoneId = (typeof LOCKABLE_ZONE_IDS)[number];

/** 1st unlock = 30, 2nd = 50, 3rd = 70 — any zone, any order. */
export const ZONE_UNLOCK_CANDY_COSTS_BY_ORDER = [30, 50, 70] as const;

export function isDefaultUnlockedZone(zoneId: string): boolean {
  return zoneId === ZONES.GRASSY_MEADOW.id;
}

export function isLockableZoneId(zoneId: string): zoneId is LockableZoneId {
  return (LOCKABLE_ZONE_IDS as readonly string[]).includes(zoneId);
}

/** Candy cost for the next zone unlock (based on unlock count, not which zone). */
export function getNextZoneUnlockCandyCost(unlockedLockableCount: number): number | null {
  if (unlockedLockableCount >= ZONE_UNLOCK_CANDY_COSTS_BY_ORDER.length) return null;
  return ZONE_UNLOCK_CANDY_COSTS_BY_ORDER[unlockedLockableCount] ?? null;
}
