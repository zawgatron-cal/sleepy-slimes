/**
 * Per-instance slime favorites (collection star).
 */

import { updateSlimeFavorited } from '@/src/db';
import { useCollectionStore } from '@/src/stores';
import type { Slime } from '@/src/types';

export async function toggleSlimeFavorite(slimeId: string): Promise<boolean | null> {
  const slime = useCollectionStore.getState().getSlimeById(slimeId);
  if (!slime) return null;

  const favorited = !slime.favorited;
  await updateSlimeFavorited(slimeId, favorited);
  useCollectionStore.getState().updateSlime(slimeId, { favorited });

  return favorited;
}

export async function setSlimeFavorite(
  slimeId: string,
  favorited: boolean
): Promise<Slime | null> {
  const slime = useCollectionStore.getState().getSlimeById(slimeId);
  if (!slime) return null;

  await updateSlimeFavorited(slimeId, favorited);
  useCollectionStore.getState().updateSlime(slimeId, { favorited });

  return { ...slime, favorited };
}
