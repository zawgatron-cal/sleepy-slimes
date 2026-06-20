/**
 * Release a owned slime for candies (tier-based payout).
 */

import { getSlimeConvertCandyValue, type Tier } from '@/src/constants/game';
import { deleteSlime } from '@/src/db';
import { useCandiesStore, useCollectionStore, useEquippedSlimeStore } from '@/src/stores';

export type ConvertSlimeResult =
  | { ok: true; candies: number }
  | { ok: false; reason: 'not_found' };

export async function convertSlimeToCandies(
  slimeId: string,
  tier: Tier
): Promise<ConvertSlimeResult> {
  const slime = useCollectionStore.getState().getSlimeById(slimeId);
  if (!slime) return { ok: false, reason: 'not_found' };

  const candies = getSlimeConvertCandyValue(tier);
  await deleteSlime(slimeId);
  useCollectionStore.getState().removeSlime(slimeId);

  if (useEquippedSlimeStore.getState().equippedSlimeId === slimeId) {
    useEquippedSlimeStore.getState().setEquippedSlimeId(null);
  }

  useCandiesStore.getState().add(candies);
  return { ok: true, candies };
}
