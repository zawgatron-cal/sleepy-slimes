/**
 * Dev — launch fixed-tier sleep reveal animation test without sleeping.
 */

import { Pressable, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  buildFixedTierRevealTestSlimes,
  FIXED_REVEAL_TEST_TIER_LABELS,
} from '@/src/services/devRevealTierTest';
import { useDevSettingsStore, useSleepStore } from '@/src/stores';
import type { Species } from '@/src/types';
import { sortSlimesByTierForReveal } from '@/src/utils/sleepScreen';
import { createAppStyles } from '@/src/theme/createAppStyles';

type RevealAnimationTestPanelProps = {
  speciesList: Species[];
};

export function RevealAnimationTestPanel({ speciesList }: RevealAnimationTestPanelProps) {
  const router = useRouter();
  const fixedTierRevealTest = useDevSettingsStore((s) => s.fixedTierRevealTest);
  const setFixedTierRevealTest = useDevSettingsStore((s) => s.setFixedTierRevealTest);

  const tierLine = FIXED_REVEAL_TEST_TIER_LABELS.join(' → ');

  const launchRevealTest = () => {
    if (speciesList.length === 0) return;

    const endedAt = Date.now();
    const slimes = buildFixedTierRevealTestSlimes(endedAt, speciesList);
    sortSlimesByTierForReveal(slimes, speciesList);

    const seenSpecies = new Set<string>();
    const newRevealSlimeIds = slimes.flatMap((s) => {
      if (seenSpecies.has(s.speciesId)) return [];
      seenSpecies.add(s.speciesId);
      return [s.id];
    });
    useSleepStore.getState().setSummaryRewards(42, slimes, 8, newRevealSlimeIds);
    useSleepStore.getState().startReveal();
    router.navigate('/(tabs)/');
  };

  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>Reveal animation test</Text>
      <Text style={styles.hint}>
        Fixed 5-slime sequence ({tierLine}). Does not write to SQLite — preview only unless
        override is on during a real sleep.
      </Text>

      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchLabel}>Override sleep slime rolls</Text>
          <Text style={styles.hint}>
            When on, completing a sleep session also awards these 5 slimes (and saves them).
          </Text>
        </View>
        <Switch value={fixedTierRevealTest} onValueChange={setFixedTierRevealTest} />
      </View>

      <Pressable
        style={[styles.launchBtn, speciesList.length === 0 && styles.btnDisabled]}
        onPress={launchRevealTest}
        disabled={speciesList.length === 0}
      >
        <Text style={styles.launchBtnText}>Launch reveal test</Text>
      </Pressable>
    </View>
  );
}

const styles = createAppStyles({
  block: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#252525',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9cf',
    marginBottom: 6,
  },
  hint: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    lineHeight: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  switchCopy: { flex: 1 },
  switchLabel: { fontSize: 13, color: '#ccc', fontWeight: '600' },
  launchBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#3d7a5a',
    borderRadius: 6,
  },
  launchBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnDisabled: { opacity: 0.55 },
});
