/**
 * Fusion screen — PRD: combine 2 slimes → 1, candy cost by tier.
 * Baseline: placeholder for slime pickers and result; structure only.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useCollectionStore, useCandiesStore } from '@/src/stores';

export default function FusionScreen() {
  const slimes = useCollectionStore((s) => s.slimes);
  const candies = useCandiesStore((s) => s.total);

  const canFuse = slimes.length >= 2 && candies > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.candies}>🍬 {candies}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fusion</Text>
        <Text style={styles.hint}>
          Select two slimes to fuse. Candy cost scales with tier.
        </Text>
        {!canFuse && (
          <Text style={styles.requirement}>
            Need at least 2 slimes and some candies to fuse.
          </Text>
        )}
      </View>

      {/* Placeholder slots for "Slime A" and "Slime B" + result */}
      <View style={styles.slots}>
        <View style={styles.slot}>
          <Text style={styles.slotLabel}>Slime A</Text>
          <Text style={styles.slotPlaceholder}>—</Text>
        </View>
        <Text style={styles.plus}>+</Text>
        <View style={styles.slot}>
          <Text style={styles.slotLabel}>Slime B</Text>
          <Text style={styles.slotPlaceholder}>—</Text>
        </View>
      </View>
      <Text style={styles.resultHint}>Result and recipe logic will be wired later.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  candies: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  hint: { fontSize: 14, color: '#666' },
  requirement: { fontSize: 14, color: '#c00', marginTop: 8 },
  slots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
  },
  slot: {
    width: 100,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotLabel: { fontSize: 12, color: '#666' },
  slotPlaceholder: { fontSize: 24, color: '#ccc' },
  plus: { fontSize: 20, color: '#999' },
  resultHint: { fontSize: 12, color: '#999' },
});
