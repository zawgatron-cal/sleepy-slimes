/**
 * Fixed slimes for the player's first valid sleep — unlocks the fusion tutorial.
 */

import { DEFAULT_SLIME_VARIANT } from '@/src/constants/game';
import { TUTORIAL_FIRST_NIGHT_SPECIES_IDS } from '@/src/constants/tutorial';
import type { Slime } from '@/src/types';
import { initialSlimeLevel } from '@/src/utils/slimeLevel';
import { generateSlimeSeed } from '@/src/utils/util';

export function buildTutorialFirstNightSlimes(endedAt: number): Slime[] {
  return TUTORIAL_FIRST_NIGHT_SPECIES_IDS.map((speciesId, index) => ({
    id: `slime_${endedAt}_${index}_${Math.random().toString(36).slice(2, 9)}`,
    speciesId,
    variant: DEFAULT_SLIME_VARIANT,
    level: initialSlimeLevel(),
    equippedNights: 0,
    seed: generateSlimeSeed(),
    acquiredAt: endedAt + index,
    source: 'sleep',
  }));
}
