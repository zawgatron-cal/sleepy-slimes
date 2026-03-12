/**
 * Species registry — single source of truth for slime species.
 * Reference by key (e.g. SPECIES.GREEN_SLIME.id) in fusion rules and spawn tables.
 * Seeded into SQLite on app init; runtime reads go through DB.
 */

import type { Species } from '@/src/types';
import { Tier, SetId } from '@/src/constants/game';

export const SPECIES = {
  GREEN_SLIME: { id: 'green_slime', name: 'Green Slime', setId: SetId.COLOR, tier: Tier.COMMON, fusionOnly: false },
  PINK_SLIME: { id: 'pink_slime', name: 'Pink Slime', setId: SetId.COLOR, tier: Tier.COMMON, fusionOnly: false },
  BLUE_SLIME: { id: 'blue_slime', name: 'Blue Slime', setId: SetId.COLOR, tier: Tier.COMMON, fusionOnly: false },
} satisfies Record<string, Species>;

export type SpeciesKey = keyof typeof SPECIES;

