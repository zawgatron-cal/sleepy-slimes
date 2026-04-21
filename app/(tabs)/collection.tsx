/**
 * Collection screen — ui-one.pdf: Slime Collection, subtitle, Search, Filter, grid.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCollectionStore } from '@/src/stores';
import { getSpecies, getSlimes } from '@/src/db';
import { TIER_LABELS, type Tier } from '@/src/constants/game';
import type { Species } from '@/src/types';
import { CollectionSlimeDetailModal } from '@/src/components';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

type TierFilter = 'all' | Tier;

export default function CollectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((s) => {
      if (tierFilter !== 'all' && s.species?.tier !== tierFilter) return false;
      if (!q) return true;
      const name = (s.species?.name ?? s.speciesId).toLowerCase();
      return name.includes(q);
    });
  }, [enriched, query, tierFilter]);

  const selected = useMemo(
    () => enriched.find((s) => s.id === selectedId),
    [enriched, selectedId]
  );

  const tierChips: { key: TierFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 1, label: TIER_LABELS[1] },
    { key: 2, label: TIER_LABELS[2] },
    { key: 3, label: TIER_LABELS[3] },
    { key: 4, label: TIER_LABELS[4] },
  ];

  const bottomPad = Math.max(insets.bottom, 8) + 12;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Slime Collection</Text>
          <Text style={styles.subtitle}>View all of the slimes you’ve collected!</Text>
        </View>
        <Pressable
          style={styles.encyBtn}
          onPress={() => router.push('/encyclopedia')}
        >
          <Text style={styles.encyBtnText}>Encyclopedia</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={mainScreens.collection.placeholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Filter</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {tierChips.map((c) => (
            <Pressable
              key={String(c.key)}
              style={[styles.chip, tierFilter === c.key && styles.chipActive]}
              onPress={() => setTierFilter(c.key)}
            >
              <Text style={[styles.chipText, tierFilter === c.key && styles.chipTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>
          {enriched.length === 0
            ? 'No slimes yet. Sleep to spawn some!'
            : 'No slimes match your search or filter.'}
        </Text>
      ) : (
        <View style={styles.grid}>
          {filtered.map((s) => (
            <Pressable
              key={s.id}
              style={styles.card}
              onPress={() => setSelectedId(s.id)}
            >
              <View style={styles.cardImageWrap}>
                <Image source={getSlimeImageSource(s.speciesId)} style={styles.cardImage} />
              </View>
              <Text style={styles.cardName} numberOfLines={1}>
                {s.species?.name ?? s.speciesId}
              </Text>
              <Text style={styles.cardTier} numberOfLines={1}>
                {s.species ? TIER_LABELS[s.species.tier].toLowerCase() : 'unknown'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

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

const styles = createAppStyles({
  screen: {
    flex: 1,
    backgroundColor: mainScreens.collection.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: mainScreens.collection.primaryText,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: mainScreens.collection.mutedText,
    lineHeight: 20,
    paddingRight: 8,
  },
  encyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: mainScreens.collection.surface,
    borderWidth: 1,
    borderColor: mainScreens.collection.borderOne,
    alignSelf: 'flex-start',
  },
  encyBtnText: { fontSize: 12, fontWeight: '800', color: mainScreens.collection.primaryText },
  searchRow: { marginBottom: 14 },
  searchInput: {
    backgroundColor: mainScreens.collection.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mainScreens.collection.borderOne,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: mainScreens.collection.primaryText,
    ...mainScreens.cardShadow,
  },
  filterRow: { marginBottom: 18 },
  filterLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: mainScreens.collection.placeholder,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chipScroll: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: mainScreens.collection.surface,
    borderWidth: 1,
    borderColor: mainScreens.collection.borderOne,
  },
  chipActive: {
    backgroundColor: mainScreens.collection.primary,
    borderColor: mainScreens.collection.primary,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: mainScreens.collection.mutedText },
  chipTextActive: { color: mainScreens.shared.onPrimary },
  empty: { fontSize: 15, color: mainScreens.collection.mutedText, marginTop: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    rowGap: 14,
  },
  card: {
    width: '31%',
    marginHorizontal: '1.1%',
    backgroundColor: mainScreens.collection.elevated,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: mainScreens.collection.borderOne,
    ...mainScreens.cardShadow,
  },
  cardImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: mainScreens.collection.surface,
  },
  cardImage: { width: 40, height: 40 },
  cardName: {
    fontWeight: '800',
    color: mainScreens.collection.primaryText,
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: '100%',
  },
  cardTier: { fontSize: 11, color: mainScreens.collection.mutedText, textTransform: 'lowercase' },
});
