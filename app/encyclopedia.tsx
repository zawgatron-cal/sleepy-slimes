/**
 * Encyclopedia screen — browsable list of species by tier.
 * Simple, read-only view for now; navigated to from Collection.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getSpecies } from '@/src/db';
import { TIER_LABELS, Tier } from '@/src/constants/game';
import type { Species } from '@/src/types';
import slimepedia from '@/src/data/slimepedia.json';
import { EncyclopediaSpeciesModal } from '@/src/components';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { createAppStyles } from '@/src/theme/createAppStyles';

export default function EncyclopediaScreen() {
  const router = useRouter();
  const [species, setSpecies] = useState<Species[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const spec = await getSpecies();
        if (!cancelled) setSpecies(spec);
      } catch (e) {
        console.warn('Encyclopedia load failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const speciesByTier = useMemo(() => {
    const byTier: Record<number, Species[]> = {};
    for (const s of species) {
      const bucket = (byTier[s.tier] ??= []);
      bucket.push(s);
    }
    (Object.values(byTier) as Species[][]).forEach((list) =>
      list.sort((a, b) => a.name.localeCompare(b.name)),
    );
    return byTier;
  }, [species]);

  const orderedTiers: Tier[] = [Tier.COMMON, Tier.UNCOMMON, Tier.RARE, Tier.ULTRA_RARE];

  const selectedSpecies = useMemo(
    () => species.find((s) => s.id === selectedId) ?? null,
    [species, selectedId]
  );

  const selectedPedia = selectedSpecies
    ? (slimepedia as Record<string, { fusionHint?: string; description?: string }>)[
        selectedSpecies.id
      ] ?? {}
    : {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Encyclopedia</Text>
        <View style={{ width: 64 }} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {orderedTiers.map((tier) => {
          const list = speciesByTier[tier] ?? [];
          if (list.length === 0) return null;
          return (
            <View key={tier} style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{TIER_LABELS[tier]}</Text>
                <Text style={styles.sectionCount}>{list.length}</Text>
              </View>
              <View style={styles.grid}>
                {list.map((s) => (
                  <Pressable
                    key={s.id}
                    style={styles.card}
                    onPress={() => setSelectedId(s.id)}
                  >
                    <View style={styles.cardEmojiWrap}>
                      <Image source={getSlimeImageSource(s.id)} style={styles.cardImage} />
                    </View>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {TIER_LABELS[s.tier]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
      {selectedSpecies && (
        <EncyclopediaSpeciesModal
          visible
          onClose={() => setSelectedId(null)}
          species={selectedSpecies}
          description={selectedPedia.description ?? 'No description'}
          fusionHint={selectedPedia.fusionHint ?? 'No fusion hint'}
        />
      )}
    </SafeAreaView>
  );
}

const styles = createAppStyles({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { paddingVertical: 8, paddingRight: 8 },
  backText: { fontSize: 14, color: '#007aff', fontWeight: '600' },
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

