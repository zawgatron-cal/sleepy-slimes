import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getFusionCompletions, getSlimepediaDiscoveredSpeciesIds } from '@/src/db';
import type { FusionCompletionRecord } from '@/src/db';
import type { Species } from '@/src/types';
import { SPECIES } from '@/src/data/species';
import { FUSION_RULES_MASTER } from '@/src/data/fusionRules';

const MASTER_SPECIES_LIST = Object.values(SPECIES) as Species[];
const MASTER_SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(
  MASTER_SPECIES_LIST.map((s) => [s.id, s])
);

let cachedDiscoveredIds: Set<string> | null = null;
let cachedCompletions: FusionCompletionRecord[] | null = null;

async function refreshSlimepediaPlayerData(): Promise<{
  discovered: string[];
  completions: FusionCompletionRecord[];
}> {
  const [completions, discovered] = await Promise.all([
    getFusionCompletions(),
    getSlimepediaDiscoveredSpeciesIds(),
  ]);
  cachedDiscoveredIds = new Set(discovered);
  cachedCompletions = completions;
  return { discovered, completions };
}

/** Warm player-specific slimepedia data (discoveries + fusion completions). */
export function preloadSlimepediaDetailData(): void {
  void refreshSlimepediaPlayerData();
}

export function useSlimepediaDetailData(speciesId: string) {
  const [everDiscoveredIds, setEverDiscoveredIds] = useState(
    () => cachedDiscoveredIds ?? new Set<string>()
  );
  const [fusionCompletions, setFusionCompletions] = useState(
    () => cachedCompletions ?? []
  );

  const applyPlayerData = useCallback(
    (discovered: string[], completions: FusionCompletionRecord[]) => {
      setEverDiscoveredIds(new Set(discovered));
      setFusionCompletions(completions);
    },
    []
  );

  const refreshDynamic = useCallback(async () => {
    try {
      const { discovered, completions } = await refreshSlimepediaPlayerData();
      applyPlayerData(discovered, completions);
    } catch (e) {
      console.warn('Slimepedia detail refresh failed', e);
    }
  }, [applyPlayerData]);

  useFocusEffect(
    useCallback(() => {
      void refreshDynamic();
    }, [refreshDynamic])
  );

  const species = useMemo(
    () => MASTER_SPECIES_BY_ID[speciesId] ?? null,
    [speciesId]
  );

  return {
    species,
    speciesById: MASTER_SPECIES_BY_ID,
    fusionRules: FUSION_RULES_MASTER,
    fusionCompletions,
    everDiscoveredIds,
  };
}
