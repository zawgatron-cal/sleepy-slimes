import { Tier } from '@/src/constants/game';
import {
  getNextZoneUnlockCandyCost,
  isDefaultUnlockedZone,
  isLockableZoneId,
} from '@/src/constants/zoneUnlock';
import type { Species, Zone } from '@/src/types';

export type ZoneUnlockProgress = {
  ultraRareDiscoveryCount: number;
  candies: number;
  unlockedZoneIds: readonly string[];
};

export type SleepZoneView = Zone & {
  unlocked: boolean;
  canUnlock: boolean;
  /** Next unlock slot candy cost (same for every locked zone). */
  nextUnlockCandyCost: number | null;
  ultraRaresNeeded: number;
};

export function countUltraRareDiscoveries(
  discoveredSpeciesIds: readonly string[],
  speciesById: Record<string, Species>
): number {
  let count = 0;
  for (const speciesId of discoveredSpeciesIds) {
    if (speciesById[speciesId]?.tier === Tier.ULTRA_RARE) count += 1;
  }
  return count;
}

export function countUnlockedLockableZones(unlockedZoneIds: readonly string[]): number {
  return unlockedZoneIds.filter(isLockableZoneId).length;
}

/** Each zone unlock spends one Ultra Rare discovery (total UR > zones already unlocked). */
export function ultraRaresNeededForNextZoneUnlock(progress: ZoneUnlockProgress): number {
  const unlockedLockable = countUnlockedLockableZones(progress.unlockedZoneIds);
  return Math.max(0, unlockedLockable + 1 - progress.ultraRareDiscoveryCount);
}

export function hasUltraRareUnlockCredit(progress: ZoneUnlockProgress): boolean {
  return ultraRaresNeededForNextZoneUnlock(progress) === 0;
}

export function isPlayerZoneUnlocked(zoneId: string, unlockedZoneIds: readonly string[]): boolean {
  return isDefaultUnlockedZone(zoneId) || unlockedZoneIds.includes(zoneId);
}

export function getNextUnlockCandyCostForProgress(progress: ZoneUnlockProgress): number | null {
  return getNextZoneUnlockCandyCost(countUnlockedLockableZones(progress.unlockedZoneIds));
}

export function canUnlockZone(zoneId: string, progress: ZoneUnlockProgress): boolean {
  if (!isLockableZoneId(zoneId)) return false;
  if (isPlayerZoneUnlocked(zoneId, progress.unlockedZoneIds)) return false;

  const candyCost = getNextUnlockCandyCostForProgress(progress);
  if (candyCost == null) return false;

  return hasUltraRareUnlockCredit(progress) && progress.candies >= candyCost;
}

export function buildSleepZoneViews(
  zones: readonly Zone[],
  progress: ZoneUnlockProgress
): SleepZoneView[] {
  const ultraRaresNeeded = ultraRaresNeededForNextZoneUnlock(progress);
  const nextUnlockCandyCost = getNextUnlockCandyCostForProgress(progress);

  return zones.map((zone) => {
    const unlocked = isPlayerZoneUnlocked(zone.id, progress.unlockedZoneIds);

    return {
      ...zone,
      unlocked,
      canUnlock: canUnlockZone(zone.id, progress),
      nextUnlockCandyCost: unlocked || !isLockableZoneId(zone.id) ? null : nextUnlockCandyCost,
      ultraRaresNeeded: unlocked ? 0 : ultraRaresNeeded,
    };
  });
}

export function getZoneUnlockBlockReason(
  zoneId: string,
  progress: ZoneUnlockProgress
): string | null {
  if (isPlayerZoneUnlocked(zoneId, progress.unlockedZoneIds)) return null;
  if (!isLockableZoneId(zoneId)) return 'This zone is locked.';

  const candyCost = getNextUnlockCandyCostForProgress(progress);
  if (candyCost == null) return 'All zones are unlocked.';

  const ultraRaresNeeded = ultraRaresNeededForNextZoneUnlock(progress);
  if (ultraRaresNeeded > 0) {
    return `Discover ${ultraRaresNeeded} more Ultra Rare ${ultraRaresNeeded === 1 ? 'species' : 'species'} in your Slimepedia.`;
  }

  if (progress.candies < candyCost) {
    return `Need ${candyCost - progress.candies} more candies.`;
  }

  return null;
}
