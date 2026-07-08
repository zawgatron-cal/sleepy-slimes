import { TUTORIAL_BUDDY_SPECIES_ID } from '@/src/constants/tutorial';
import type { Slime } from '@/src/types';

/** Grass slime from the first sleep — buddy tutorial target. */
export function findTutorialBuddySlime(slimes: Slime[]): Slime | undefined {
  return slimes.find((s) => s.speciesId === TUTORIAL_BUDDY_SPECIES_ID);
}
