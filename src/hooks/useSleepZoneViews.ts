import { useMemo } from 'react';
import { useCandiesStore, useZoneUnlockStore } from '@/src/stores';
import { buildSleepZoneViews, getZoneUnlockBlockReason } from '@/src/utils/zoneUnlock';
import type { Zone } from '@/src/types';

export function useSleepZoneViews(zones: readonly Zone[]) {
  const ultraRareDiscoveryCount = useZoneUnlockStore((s) => s.ultraRareDiscoveryCount);
  const unlockedZoneIds = useZoneUnlockStore((s) => s.unlockedZoneIds);
  const candies = useCandiesStore((s) => s.total);

  const progress = useMemo(
    () => ({ ultraRareDiscoveryCount, unlockedZoneIds, candies }),
    [ultraRareDiscoveryCount, unlockedZoneIds, candies]
  );

  const zoneViews = useMemo(
    () => buildSleepZoneViews(zones, progress),
    [zones, progress]
  );

  return { zoneViews, progress };
}

export function useZoneUnlockBlockReason(
  zoneId: string | null,
  progress: { ultraRareDiscoveryCount: number; candies: number; unlockedZoneIds: readonly string[] }
) {
  return useMemo(() => {
    if (!zoneId) return null;
    return getZoneUnlockBlockReason(zoneId, progress);
  }, [zoneId, progress]);
}
