/**
 * Slimepedia — species detail screen.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getSpecies,
  getFusionRules,
  getFusionCompletions,
  getSlimepediaDiscoveredSpeciesIds,
} from '@/src/db';
import type { FusionCompletionRecord } from '@/src/db';
import type { FusionRule, Species } from '@/src/types';
import slimepediaData from '@/src/data/slimepedia.json';
import { SlimepediaSpeciesDetail } from '@/src/components';
import { useDevSettingsStore } from '@/src/stores/useDevSettingsStore';
import type { SlimepediaEntry } from '@/src/utils/slimepediaContent';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

export default function SlimepediaSpeciesScreen() {
  const router = useRouter();
  const { speciesId } = useLocalSearchParams<{ speciesId: string }>();
  const id = typeof speciesId === 'string' ? speciesId : '';
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [species, setSpecies] = useState<Species | null>(null);
  const [everDiscoveredIds, setEverDiscoveredIds] = useState<Set<string>>(() => new Set());
  const [fusionRules, setFusionRules] = useState<FusionRule[]>([]);
  const [fusionCompletions, setFusionCompletions] = useState<FusionCompletionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const unlockSlimepedia = useDevSettingsStore((s) => s.unlockSlimepedia);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, rules, completions, discovered] = await Promise.all([
          getSpecies(),
          getFusionRules(),
          getFusionCompletions(),
          getSlimepediaDiscoveredSpeciesIds(),
        ]);
        if (cancelled) return;
        setAllSpecies(all);
        setSpecies(all.find((s) => s.id === id) ?? null);
        setEverDiscoveredIds(new Set(discovered));
        setFusionRules(rules);
        setFusionCompletions(completions);
      } catch (e) {
        console.warn('Slimepedia species load failed', e);
        if (!cancelled) setSpecies(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [completions, discovered] = await Promise.all([
            getFusionCompletions(),
            getSlimepediaDiscoveredSpeciesIds(),
          ]);
          if (cancelled) return;
          setEverDiscoveredIds(new Set(discovered));
          setFusionCompletions(completions);
        } catch (e) {
          console.warn('Slimepedia species refresh failed', e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const speciesById = useMemo(() => {
    const map: Record<string, Species> = {};
    for (const s of allSpecies) map[s.id] = s;
    return map;
  }, [allSpecies]);

  const slimepediaById = slimepediaData as Record<string, SlimepediaEntry>;

  const entry = useMemo(() => {
    if (!species) return undefined;
    return (slimepediaData as Record<string, SlimepediaEntry>)[species.id];
  }, [species]);

  useEffect(() => {
    if (!loading && !species) {
      router.back();
    }
  }, [loading, species, router]);

  const showEverDiscovered = (__DEV__ && unlockSlimepedia) || everDiscoveredIds.has(id);
  const displayEverDiscoveredIds = useMemo(() => {
    if (__DEV__ && unlockSlimepedia) {
      return new Set(allSpecies.map((s) => s.id));
    }
    return everDiscoveredIds;
  }, [allSpecies, everDiscoveredIds, unlockSlimepedia]);

  if (loading || !species) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={mainScreens.slimepedia.setChrome} />
      </View>
    );
  }

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

const styles = createAppStyles({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mainScreens.slimepedia.detail.bg,
  },
});
