/**
 * Collection screen — PRD: player inventory + Slime Encyclopedia.
 * Baseline: list of owned slimes (empty state), placeholder for sets/species encyclopedia.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useCollectionStore, useCandiesStore } from '@/src/stores';

export default function CollectionScreen() {
  const slimes = useCollectionStore((s) => s.slimes);
  const candies = useCandiesStore((s) => s.total);

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.count}>Slimes: {slimes.length}</Text>
        <Text style={styles.candies}>🍬 {candies}</Text>
      </View>

      {/* Inventory list — empty state for baseline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your slimes</Text>
        {slimes.length === 0 ? (
          <Text style={styles.empty}>No slimes yet. Sleep to spawn some!</Text>
        ) : (
          <Text style={styles.hint}>Slime cards will render here (structure ready).</Text>
        )}
      </View>

      {/* Encyclopedia placeholder — sets and species browser */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Encyclopedia</Text>
        <Text style={styles.hint}>
          Sets, species, and fusion recipes will be browsable here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  count: { fontSize: 18, fontWeight: '600' },
  candies: { fontSize: 18, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  empty: { fontSize: 14, color: '#666' },
  hint: { fontSize: 14, color: '#999' },
});
