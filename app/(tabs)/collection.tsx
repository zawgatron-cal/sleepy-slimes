/**
 * Collection screen — shows player slimes from the collection store.
 * Uses species data for names/tiers and renders a simple grid + detail modal.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { useCollectionStore } from '@/src/stores';
import { getSpecies, getSlimes } from '@/src/db';
import { TIER_LABELS } from '@/src/constants/game';
import type { Species } from '@/src/types';
import { CollectionSlimeDetailModal } from '@/src/components';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';

export default function CollectionScreen() {
  const router = useRouter();
  const { slimes, isLoading, setSlimes, setLoading } = useCollectionStore(
    useShallow((s) => ({
      slimes: s.slimes,
      isLoading: s.isLoading,
      setSlimes: s.setSlimes,
      setLoading: s.setLoading,
    }))
  );
  const [species, setSpecies] = useState<Species[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [spec, dbSlimes] = await Promise.all([getSpecies(), getSlimes()]);
        if (!cancelled) {
          setSpecies(spec);
          setSlimes(dbSlimes);
        }
      } catch (e) {
        console.warn('Collection load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const speciesById = useMemo(() => {
    const map: Record<string, Species> = {};
    for (const s of species) map[s.id] = s;
    return map;
  }, [species]);

  const enriched = useMemo(
    () =>
      slimes.map((s) => ({
        ...s,
        species: speciesById[s.speciesId],
      })),
    [slimes, speciesById]
  );

  const selected = useMemo(
    () => enriched.find((s) => s.id === selectedId),
    [enriched, selectedId]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <Text style={styles.headerTitle}>Collection</Text>
        <Pressable
          style={styles.encyclopediaButton}
          onPress={() => router.push('/encyclopedia')}
        >
          <Text style={styles.encyclopediaButtonText}>Encyclopedia</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your slimes</Text>
          <Text style={styles.sectionCount}>{slimes.length}</Text>
        </View>
        {isLoading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : enriched.length === 0 ? (
          <Text style={styles.empty}>No slimes yet. Sleep to spawn some!</Text>
        ) : (
          <View style={styles.grid}>
            {enriched.map((s) => (
              <Pressable
                key={s.id}
                style={styles.card}
                onPress={() => setSelectedId(s.id)}
              >
                <View style={styles.cardEmojiWrap}>
                  <Image source={getSlimeImageSource(s.speciesId)} style={styles.cardImage} />
                </View>
                <Text style={styles.cardName} numberOfLines={1}>
                  {s.species?.name ?? s.speciesId}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {s.species ? TIER_LABELS[s.species.tier] : 'Unknown tier'}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {new Date(s.acquiredAt).toLocaleDateString()}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {selected && (
        <CollectionSlimeDetailModal
          visible
          onClose={() => setSelectedId(null)}
          slime={{
            speciesId: selected.speciesId,
            acquiredAt: selected.acquiredAt,
            species: selected.species,
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: { padding: 16, paddingBottom: 24 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  encyclopediaButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  encyclopediaButtonText: { fontSize: 12, fontWeight: '700', color: '#333' },
  section: { marginBottom: 24 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  sectionCount: { fontSize: 13, fontWeight: '700', color: '#666' },
  empty: { fontSize: 14, color: '#666' },
  hint: { fontSize: 14, color: '#999' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    rowGap: 12,
  },
  card: {
    width: '48%',
    marginHorizontal: '1%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  cardImage: { width: 36, height: 36 },
  cardName: { fontWeight: '700', color: '#111', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: '#666' },
});
