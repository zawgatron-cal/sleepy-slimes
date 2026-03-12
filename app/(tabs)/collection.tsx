/**
 * Collection screen — shows player slimes from the collection store.
 * Uses species data for names/tiers and renders a simple grid + detail modal.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useCollectionStore, useCandiesStore } from '@/src/stores';
import { getSpecies, getSlimes } from '@/src/db';
import { TIER_LABELS } from '@/src/constants/game';
import type { Species } from '@/src/types';

export default function CollectionScreen() {
  const { slimes, isLoading, setSlimes, setLoading } = useCollectionStore(
    useShallow((s) => ({
      slimes: s.slimes,
      isLoading: s.isLoading,
      setSlimes: s.setSlimes,
      setLoading: s.setLoading,
    }))
  );
  const candies = useCandiesStore((s) => s.total);
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
                  <Text style={styles.cardEmoji}>🟢</Text>
                </View>
                <Text style={styles.cardName} numberOfLines={1}>
                  {s.species?.name ?? s.speciesId}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {s.species ? `Tier ${s.species.tier}` : 'Unknown tier'}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {new Date(s.acquiredAt).toLocaleDateString()}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Encyclopedia</Text>
        <Text style={styles.hint}>
          Sets, species, and fusion recipes will be browsable here later.
        </Text>
      </View>

      {/* Slime detail modal */}
      {selected && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedId(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedId(null)}
          >
            <Pressable
              style={styles.modalCardWrap}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalCard}>
                <View style={styles.modalEmojiWrap}>
                  <Text style={styles.modalEmoji}>🟢</Text>
                </View>
                <Text style={styles.modalName}>
                  {selected.species?.name ?? selected.speciesId}
                </Text>
                <Text style={styles.modalTier}>
                  {selected.species
                    ? TIER_LABELS[selected.species.tier]
                    : ''}
                </Text>
                <Text style={styles.modalAcquired}>
                  acquired:{' '}
                  {new Date(selected.acquiredAt).toLocaleDateString()}
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
  cardEmoji: { fontSize: 30 },
  cardName: { fontWeight: '700', color: '#111', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: '#666' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCardWrap: { width: '100%', maxWidth: 360 },
  modalCard: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalEmojiWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  modalEmoji: { fontSize: 56 },
  modalName: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 4 },
  modalTier: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 12 },
  modalAcquired: { fontSize: 14, color: '#333' },
});
