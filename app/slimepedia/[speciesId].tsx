/**
 * Slimepedia — species detail screen.
 */

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getSpecies, getSlimes } from '@/src/db';
import type { Species } from '@/src/types';
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
  const [species, setSpecies] = useState<Species | null>(null);
  const [discovered, setDiscovered] = useState(false);
  const [loading, setLoading] = useState(true);
  const unlockSlimepedia = useDevSettingsStore((s) => s.unlockSlimepedia);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, slimes] = await Promise.all([getSpecies(), getSlimes()]);
        if (cancelled) return;
        setSpecies(all.find((s) => s.id === id) ?? null);
        setDiscovered(slimes.some((s) => s.speciesId === id));
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

  const entry = useMemo(() => {
    if (!species) return undefined;
    return (slimepediaData as Record<string, SlimepediaEntry>)[species.id];
  }, [species]);

  useEffect(() => {
    if (!loading && !species) {
      router.back();
    }
  }, [loading, species, router]);

  const showDiscovered = (__DEV__ && unlockSlimepedia) || discovered;

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
      discovered={showDiscovered}
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
