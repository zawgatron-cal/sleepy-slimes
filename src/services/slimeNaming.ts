/**
 * Per-instance slime nicknames (does not change species_id).
 */

import { updateSlimeNickname as persistSlimeNickname } from '@/src/db';
import { useCollectionStore } from '@/src/stores';
import type { Slime, Species } from '@/src/types';
import {
  getSpeciesDefaultDisplayName,
  normalizeSlimeNickname,
} from '@/src/utils/slimeDisplayName';

export async function applySlimeNickname(
  slimeId: string,
  species: Species | undefined | null,
  speciesId: string,
  rawNickname: string
): Promise<Slime | null> {
  const slime = useCollectionStore.getState().getSlimeById(slimeId);
  if (!slime) return null;

  const defaultName = getSpeciesDefaultDisplayName(species, speciesId);
  const nickname = normalizeSlimeNickname(rawNickname, defaultName);

  await persistSlimeNickname(slimeId, nickname);
  useCollectionStore.getState().updateSlime(slimeId, { nickname: nickname ?? undefined });

  return { ...slime, nickname: nickname ?? undefined };
}

export async function resetSlimeNickname(slimeId: string): Promise<Slime | null> {
  const slime = useCollectionStore.getState().getSlimeById(slimeId);
  if (!slime) return null;

  await persistSlimeNickname(slimeId, null);
  useCollectionStore.getState().updateSlime(slimeId, { nickname: undefined });

  return { ...slime, nickname: undefined };
}
