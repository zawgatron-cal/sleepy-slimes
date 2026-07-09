/**
 * Dev — preview prismatic / exotic / gold sleep reveal animation beats.
 */

import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  buildVariantRevealTestSlime,
  VARIANT_REVEAL_TEST_CASES,
  type VariantRevealTestCase,
} from '@/src/services/devVariantRevealTest';
import { useSleepStore } from '@/src/stores';
import type { Species } from '@/src/types';
import { createAppStyles } from '@/src/theme/createAppStyles';

type VariantRevealTestPanelProps = {
  speciesList: Species[];
};

export function VariantRevealTestPanel({ speciesList }: VariantRevealTestPanelProps) {
  const router = useRouter();

  const launch = (testCase: VariantRevealTestCase) => {
    if (speciesList.length === 0) return;

    const endedAt = Date.now();
    const slime = buildVariantRevealTestSlime(endedAt, speciesList, testCase);
    const newRevealSlimeIds = testCase.isNewSpecies ? [slime.id] : [];

    useSleepStore.getState().setSummaryRewards(42, [slime], 8, newRevealSlimeIds);
    useSleepStore.getState().startReveal();
    router.navigate('/(tabs)/');
  };

  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>Variant reveal test</Text>
      <Text style={styles.hint}>
        Launches a single sleep reveal on the Sleep tab. Does not write to SQLite — preview only.
      </Text>

      <View style={styles.buttonGrid}>
        {VARIANT_REVEAL_TEST_CASES.map((testCase) => (
          <Pressable
            key={testCase.id}
            style={[styles.launchBtn, speciesList.length === 0 && styles.btnDisabled]}
            onPress={() => launch(testCase)}
            disabled={speciesList.length === 0}
          >
            <Text style={styles.launchBtnText}>{testCase.label}</Text>
          </Pressable>
        ))}
      </View>
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
  buttonGrid: {
    marginTop: 14,
    gap: 8,
  },
  launchBtn: {
    alignSelf: 'stretch',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#6b4c9a',
    borderRadius: 6,
  },
  launchBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnDisabled: { opacity: 0.55 },
});
