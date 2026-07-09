import { PLAYER_SETTING_KEYS } from '@/src/constants/playerSettings';
import { ZONES } from '@/src/data/zones';
import { getPlayerSetting, getSlimepediaDiscoveredSpeciesIds, getSpecies, setPlayerSetting } from '@/src/db';
import { useCandiesStore, useSleepStore, useZoneUnlockStore } from '@/src/stores';
import {
  canUnlockZone,
  countUltraRareDiscoveries,
  getNextUnlockCandyCostForProgress,
  getZoneUnlockBlockReason,
  isPlayerZoneUnlocked,
  type ZoneUnlockProgress,
} from '@/src/utils/zoneUnlock';
import { LOCKABLE_ZONE_IDS, isLockableZoneId } from '@/src/constants/zoneUnlock';

export async function getPersistedUnlockedZoneIds(): Promise<string[]> {
  const raw = await getPlayerSetting(PLAYER_SETTING_KEYS.UNLOCKED_ZONE_IDS);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && isLockableZoneId(id));
  } catch {
    return [];
  }
}

async function persistUnlockedZoneIds(zoneIds: string[]): Promise<void> {
  const unique = LOCKABLE_ZONE_IDS.filter((id) => zoneIds.includes(id));
  await setPlayerSetting(
    PLAYER_SETTING_KEYS.UNLOCKED_ZONE_IDS,
    unique.length > 0 ? JSON.stringify(unique) : null
  );
}

export async function loadZoneUnlockProgress(): Promise<ZoneUnlockProgress> {
  const [species, discoveredSpeciesIds, unlockedZoneIds] = await Promise.all([
    getSpecies(),
    getSlimepediaDiscoveredSpeciesIds(),
    getPersistedUnlockedZoneIds(),
  ]);
  const speciesById = Object.fromEntries(species.map((s) => [s.id, s]));

  return {
    ultraRareDiscoveryCount: countUltraRareDiscoveries(discoveredSpeciesIds, speciesById),
    candies: useCandiesStore.getState().total,
    unlockedZoneIds,
  };
}

export async function refreshZoneUnlockStore(): Promise<void> {
  const progress = await loadZoneUnlockProgress();
  useZoneUnlockStore.getState().hydrate(progress);
}

export async function unlockZone(
  zoneId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const progress = await loadZoneUnlockProgress();
  const blockReason = getZoneUnlockBlockReason(zoneId, progress);
  if (blockReason) return { ok: false, message: blockReason };
  if (!canUnlockZone(zoneId, progress)) {
    return { ok: false, message: 'This zone cannot be unlocked yet.' };
  }

  const candyCost = getNextUnlockCandyCostForProgress(progress);
  if (candyCost == null) return { ok: false, message: 'This zone cannot be unlocked.' };

  const spent = useCandiesStore.getState().spend(candyCost);
  if (!spent) return { ok: false, message: 'Not enough candies.' };

  const unlockedZoneIds = [...progress.unlockedZoneIds, zoneId];
  try {
    await persistUnlockedZoneIds(unlockedZoneIds);
  } catch (err) {
    useCandiesStore.getState().add(candyCost);
    console.warn('Zone unlock persist failed', err);
    return { ok: false, message: 'Could not save zone unlock.' };
  }

  const nextProgress = await loadZoneUnlockProgress();
  useZoneUnlockStore.getState().hydrate(nextProgress);
  return { ok: true };
}

/** Dev / testing — lock all purchasable zones again (starter meadow stays unlocked). */
export async function resetUnlockedZones(): Promise<void> {
  await persistUnlockedZoneIds([]);
  const selectedZoneId = useSleepStore.getState().selectedZoneId;
  if (!isPlayerZoneUnlocked(selectedZoneId, [])) {
    useSleepStore.getState().setSelectedZone(ZONES.GRASSY_MEADOW.id);
  }
  await refreshZoneUnlockStore();
}
