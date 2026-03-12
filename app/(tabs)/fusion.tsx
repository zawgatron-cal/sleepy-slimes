/**
 * Fusion screen — PRD: combine 2 slimes → 1, candy cost by tier.
 * Implemented: pick two slimes, show cost, fuse using DB fusion rules, show result modal.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Alert } from 'react-native';
import { useCollectionStore, useCandiesStore } from '@/src/stores';
import { deleteSlime, getFusionResultsForParents, getSpecies, getSlimes, insertSlime } from '@/src/db';
import { TIER_LABELS } from '@/src/constants/game';
import type { FusionRule, Slime, Species } from '@/src/types';

function pickWeighted<T extends { weight: number | null }>(items: T[]): T {
  const weighted = items.map((i) => ({ ...i, w: i.weight ?? 0 })).filter((i) => i.w > 0);
  if (weighted.length === 0) return items[0];
  const sum = weighted.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * sum;
  for (const it of weighted) {
    r -= it.w;
    if (r <= 0) return it;
  }
  return weighted[weighted.length - 1];
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 9);
}

type Slot = 'a' | 'b';

export default function FusionScreen() {
  const slimes = useCollectionStore((s) => s.slimes);
  const removeSlime = useCollectionStore((s) => s.removeSlime);
  const candies = useCandiesStore((s) => s.total);
  const spend = useCandiesStore((s) => s.spend);

  const [species, setSpecies] = useState<Species[]>([]);
  const [slotASpeciesId, setSlotASpeciesId] = useState<string | null>(null);
  const [slotBSpeciesId, setSlotBSpeciesId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<Slot>('a');
  const [isFusing, setIsFusing] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [resultSpecies, setResultSpecies] = useState<Species | null>(null);

  useEffect(() => {
    getSpecies().then(setSpecies).catch((e) => console.warn('getSpecies failed', e));
  }, []);

  // Ensure collection store is hydrated even if user hasn't opened Collection tab yet.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const dbSlimes = await getSlimes();
        if (!cancelled) {
          useCollectionStore.getState().setSlimes(dbSlimes);
        }
      } catch (e) {
        console.warn('Fusion load slimes failed', e);
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

  const countsBySpecies = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of slimes) {
      counts[s.speciesId] = (counts[s.speciesId] ?? 0) + 1;
    }
    return counts;
  }, [slimes]);

  const speciesA = slotASpeciesId ? speciesById[slotASpeciesId] : undefined;
  const speciesB = slotBSpeciesId ? speciesById[slotBSpeciesId] : undefined;

  const [rules, setRules] = useState<FusionRule[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!speciesA || !speciesB) {
      setRules(null);
      return;
    }
    getFusionResultsForParents(speciesA.id, speciesB.id)
      .then((r) => {
        if (!cancelled) setRules(r);
      })
      .catch((e) => {
        console.warn('getFusionResultsForParents failed', e);
        if (!cancelled) setRules([]);
      });
    return () => {
      cancelled = true;
    };
  }, [speciesA?.id, speciesB?.id]);

  const cost = useMemo(() => {
    if (!rules || rules.length === 0) return 0;
    // Same cost for all rules for a given pair (by design).
    return rules[0]?.candyCost ?? 0;
  }, [rules]);

  const canFuse = !!speciesA && !!speciesB && (rules?.length ?? 0) > 0 && !isFusing;

  const openPicker = (slot: Slot) => {
    setActiveSlot(slot);
    setPickerVisible(true);
  };

  const pickForSlot = (speciesId: string) => {
    if (activeSlot === 'a') setSlotASpeciesId(speciesId);
    else setSlotBSpeciesId(speciesId);
    setPickerVisible(false);
  };

  const availableSpecies = useMemo(() => {
    const counts: Record<string, number> = { ...countsBySpecies };
    // Reserve one instance for the other slot's currently selected species.
    if (activeSlot === 'a' && slotBSpeciesId) {
      counts[slotBSpeciesId] = (counts[slotBSpeciesId] ?? 0) - 1;
    }
    if (activeSlot === 'b' && slotASpeciesId) {
      counts[slotASpeciesId] = (counts[slotASpeciesId] ?? 0) - 1;
    }
    return Object.keys(counts)
      .map((id) => ({ species: speciesById[id], count: counts[id] ?? 0 }))
      .filter((entry) => entry.species && entry.count > 0);
  }, [countsBySpecies, activeSlot, slotASpeciesId, slotBSpeciesId, speciesById]);

  const handleFuse = async () => {
    if (!speciesA || !speciesB || !slotASpeciesId || !slotBSpeciesId) return;
    if (!rules || rules.length === 0) return;

    if (candies < cost) {
      Alert.alert('Not enough candies', `Need ${cost} candies to fuse.`);
      return;
    }

    setIsFusing(true);
    try {
      const ok = spend(cost);
      if (!ok) {
        Alert.alert('Not enough candies', `Need ${cost} candies to fuse.`);
        return;
      }

      const deterministic = rules.filter((r) => r.deterministic);
      const chosen = deterministic.length > 0 ? deterministic[0] : pickWeighted(rules);
      const result = speciesById[chosen.resultSpeciesId];
      if (!result) throw new Error(`Missing result species: ${chosen.resultSpeciesId}`);

      // Choose concrete slime instances to consume, honoring species selections.
      const pool = [...slimes];
      const slimeA = pool.find((s) => s.speciesId === slotASpeciesId);
      if (!slimeA) throw new Error('No slime instance for slot A');
      const idx = pool.findIndex((s) => s.id === slimeA.id);
      if (idx >= 0) pool.splice(idx, 1);
      const slimeB = pool.find((s) => s.speciesId === slotBSpeciesId);
      if (!slimeB) throw new Error('No slime instance for slot B');

      const now = Date.now();
      const newSlime: Slime = {
        id: `slime_${now}_${shortId()}`,
        speciesId: result.id,
        acquiredAt: now,
        source: 'fusion',
      };

      // Persist: remove parents, add result.
      await Promise.all([deleteSlime(slimeA.id), deleteSlime(slimeB.id), insertSlime(newSlime)]);

      // Update in-memory store.
      removeSlime(slimeA.id);
      removeSlime(slimeB.id);
      useCollectionStore.getState().addSlime(newSlime);

      setResultSpecies(result);
      setResultVisible(true);
      setSlotASpeciesId(null);
      setSlotBSpeciesId(null);
    } catch (e) {
      console.warn('Fusion failed', e);
      Alert.alert('Fusion failed', 'Something went wrong while fusing.');
    } finally {
      setIsFusing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Fuse Screen</Text>

        <View style={styles.slotsRow}>
          <Pressable style={styles.slotBox} onPress={() => openPicker('a')}>
            {speciesA ? (
              <>
                <Text style={styles.slotEmoji}>🙂</Text>
                <Text style={styles.slotName} numberOfLines={1}>
                  {speciesA.name}
                </Text>
              </>
            ) : (
              <View style={styles.slotEmpty} />
            )}
          </Pressable>

          <Pressable style={styles.slotBox} onPress={() => openPicker('b')}>
            {speciesB ? (
              <>
                <Text style={styles.slotEmoji}>🙂</Text>
                <Text style={styles.slotName} numberOfLines={1}>
                  {speciesB.name}
                </Text>
              </>
            ) : (
              <View style={styles.slotEmpty} />
            )}
          </Pressable>
        </View>

        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Cost:</Text>
          <Text style={styles.costValue}>
            {cost} 🍬
          </Text>
        </View>

        <Pressable
          style={[styles.fuseButton, (!canFuse || candies < cost) && styles.fuseButtonDisabled]}
          onPress={handleFuse}
          disabled={!canFuse || candies < cost}
        >
          <Text style={styles.fuseButtonText}>{isFusing ? 'Fusing…' : 'Fuse'}</Text>
        </Pressable>

        {!speciesA || !speciesB ? (
          <Text style={styles.hint}>Tap the squares to pick two slimes.</Text>
        ) : (rules?.length ?? 0) === 0 ? (
          <Text style={styles.hint}>No recipe for this pair.</Text>
        ) : candies < cost ? (
          <Text style={styles.hint}>Not enough candies.</Text>
        ) : null}
      </View>

      {/* Picker modal */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Pick a slime</Text>
            <ScrollView style={styles.pickerList}>
              {availableSpecies.length === 0 ? (
                <Text style={styles.pickerEmpty}>No available slimes.</Text>
              ) : (
                availableSpecies.map(({ species: sp, count }) => {
                  return (
                    <Pressable
                      key={sp!.id}
                      style={styles.pickerRow}
                      onPress={() => pickForSlot(sp!.id)}
                    >
                      <Text style={styles.pickerEmoji}>🙂</Text>
                      <View style={styles.pickerMetaRow}>
                        <View style={styles.pickerMeta}>
                          <Text style={styles.pickerName}>{sp?.name}</Text>
                          <Text style={styles.pickerTier}>
                            {sp ? TIER_LABELS[sp.tier] : 'Unknown tier'}
                          </Text>
                        </View>
                        <Text style={styles.pickerCount}>x{count}</Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <Pressable style={styles.pickerClose} onPress={() => setPickerVisible(false)}>
              <Text style={styles.pickerCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Result modal */}
      <Modal visible={resultVisible} transparent animationType="fade" onRequestClose={() => setResultVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.resultCardWrap}>
            <Text style={styles.resultHeader}>Fusion Result Modal</Text>
            <View style={styles.resultCard}>
              <Text style={styles.resultYouGot}>You Got:</Text>
              <View style={styles.resultIcon}>
                <Text style={styles.resultIconText}>🙂</Text>
              </View>
              <Text style={styles.resultName} numberOfLines={2}>
                {resultSpecies?.name ?? '—'}
              </Text>
              <Text style={styles.resultTier}>
                {resultSpecies ? TIER_LABELS[resultSpecies.tier] : ''}
              </Text>
              <Pressable style={styles.resultFuseBtn} onPress={() => setResultVisible(false)}>
                <Text style={styles.resultFuseText}>Yay!</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 18 },

  slotsRow: { flexDirection: 'row', gap: 24, marginBottom: 18 },
  slotBox: {
    width: 92,
    height: 92,
    backgroundColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEmpty: { width: 76, height: 76, backgroundColor: '#d9d9d9' },
  slotEmoji: { fontSize: 36, marginBottom: 6 },
  slotName: { fontSize: 12, fontWeight: '700', color: '#111', maxWidth: 84, textAlign: 'center' },

  costRow: {
    width: '86%',
    maxWidth: 360,
    backgroundColor: '#d9d9d9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  costLabel: { fontSize: 18, fontWeight: '800', color: '#111' },
  costValue: { fontSize: 18, fontWeight: '800', color: '#111' },

  fuseButton: {
    width: '86%',
    maxWidth: 360,
    backgroundColor: '#d9d9d9',
    paddingVertical: 14,
    alignItems: 'center',
  },
  fuseButtonDisabled: { opacity: 0.5 },
  fuseButtonText: { fontSize: 20, fontWeight: '800', color: '#111' },

  hint: { marginTop: 12, fontSize: 13, color: '#666' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  pickerCard: { width: '92%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 10, padding: 14 },
  pickerTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 10 },
  pickerList: { maxHeight: 360 },
  pickerEmpty: { color: '#666', paddingVertical: 14 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pickerEmoji: { fontSize: 26, width: 44, textAlign: 'center' },
  pickerMetaRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerMeta: { flexShrink: 1, paddingRight: 8 },
  pickerName: { fontSize: 14, fontWeight: '700', color: '#111' },
  pickerTier: { fontSize: 12, color: '#666', marginTop: 2 },
  pickerCount: { fontSize: 13, fontWeight: '700', color: '#111' },
  pickerClose: { marginTop: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8 },
  pickerCloseText: { fontSize: 14, fontWeight: '700', color: '#111' },

  resultCardWrap: { width: '92%', maxWidth: 420 },
  resultHeader: { color: '#cfcfcf', fontSize: 16, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  resultCard: { backgroundColor: '#d9d9d9', padding: 18, alignItems: 'center' },
  resultYouGot: { alignSelf: 'flex-start', fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 10 },
  resultIcon: { width: 118, height: 118, borderRadius: 59, borderWidth: 6, borderColor: '#222', alignItems: 'center', justifyContent: 'center', marginBottom: 14, backgroundColor: '#d9d9d9' },
  resultIconText: { fontSize: 56 },
  resultName: { fontSize: 22, fontWeight: '900', color: '#111', textAlign: 'center' },
  resultTier: { fontSize: 18, fontWeight: '800', color: '#111', marginTop: 4, marginBottom: 12 },
  resultFuseBtn: { width: '100%', backgroundColor: '#cfcfcf', paddingVertical: 12, alignItems: 'center' },
  resultFuseText: { fontSize: 22, fontWeight: '900', color: '#111' },
});
