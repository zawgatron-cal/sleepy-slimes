/**
 * Slimepedia — species detail screen.
 */

import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import slimepediaData from '@/src/data/slimepedia.json';
import { SlimepediaSpeciesDetail } from '@/src/components';
import { useDevSettingsStore } from '@/src/stores/useDevSettingsStore';
import { useSlimepediaDetailData } from '@/src/hooks/useSlimepediaDetailData';
import type { SlimepediaEntry } from '@/src/utils/slimepediaContent';

export default function SlimepediaSpeciesScreen() {
  const router = useRouter();
  const { speciesId } = useLocalSearchParams<{ speciesId: string }>();
  const id = typeof speciesId === 'string' ? speciesId : '';

  const unlockSlimepedia = useDevSettingsStore((s) => s.unlockSlimepedia);
  const { species, speciesById, fusionRules, fusionCompletions, everDiscoveredIds } =
    useSlimepediaDetailData(id);

  const slimepediaById = slimepediaData as Record<string, SlimepediaEntry>;

  const entry = useMemo(() => {
    if (!species) return undefined;
    return slimepediaById[species.id];
  }, [species, slimepediaById]);

  const displayEverDiscoveredIds = useMemo(() => {
    if (__DEV__ && unlockSlimepedia) {
      return new Set(Object.keys(speciesById));
    }
    return everDiscoveredIds;
  }, [speciesById, everDiscoveredIds, unlockSlimepedia]);

  useEffect(() => {
    if (!species) {
      router.back();
    }
  }, [species, router]);

  if (!species) {
    return <View />;
  }

  const showEverDiscovered = (__DEV__ && unlockSlimepedia) || everDiscoveredIds.has(id);

  return (
    <SlimepediaSpeciesDetail
      species={species}
      everDiscovered={showEverDiscovered}
      everDiscoveredIds={displayEverDiscoveredIds}
      fusionProgressIds={everDiscoveredIds}
      devUnlockAllPortraits={__DEV__ && unlockSlimepedia}
      fusionCompletions={fusionCompletions}
      fusionRules={fusionRules}
      speciesById={speciesById}
      slimepediaById={slimepediaById}
      entry={entry}
      onBack={() => router.back()}
    />
  );
}
