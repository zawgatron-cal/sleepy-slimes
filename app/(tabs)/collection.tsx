/**
 * Collection screen — ui-one.pdf: Slime Collection, subtitle, Search, Filter, grid.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useCollectionStore } from '@/src/stores';
import { getSpecies, getSlimes } from '@/src/db';
import type { Species } from '@/src/types';
import {
  CollectionSlimeCard,
  CollectionSlimeDetailModal,
  OutlinedSvgLabel,
} from '@/src/components';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { SLEEP_TRACKING_LOGO } from '@/src/constants/sleepTrackingAssets';

type SortKey = 'name' | 'tier';
const SORT_LABEL: Record<SortKey, string> = {
  name: 'Name',
  tier: 'Tier',
};
const SORT_ORDER: SortKey[] = ['name', 'tier'];
const TITLE_LABEL = 'Slime Collection';
const TITLE_FONT = 40;
const TITLE_HEIGHT = 56;
const TITLE_STROKE = 2.2;
const CONTROL_PILL_HEIGHT = 48;
/** Must match `styles.content.paddingHorizontal`. */
const CONTENT_HORIZONTAL_PAD = 14;
const GRID_COLUMN_GAP = 10;
const GRID_ROW_GAP = 18;

function CollectionTitleLabel() {
  const defaultW = Math.min(360, Math.max(180, Dimensions.get('window').width - 56));

  return (
    <OutlinedSvgLabel
      text={TITLE_LABEL}
      fontSize={TITLE_FONT}
      height={TITLE_HEIGHT}
      baselineY={42}
      strokeWidth={TITLE_STROKE}
      strokeColor={mainScreens.idle.specialTextBorder}
      fillColor={mainScreens.idle.surface}
      textAnchor="start"
      style={styles.titleSvgWrap}
      defaultWidth={defaultW}
    />
  );
}

export default function CollectionScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);
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
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [ascending, setAscending] = useState(false);
  const [sortExpanded, setSortExpanded] = useState(false);

  const collectionCardWidth = useMemo(() => {
    const rowInner = windowWidth - CONTENT_HORIZONTAL_PAD * 2;
    const afterGaps = rowInner - GRID_COLUMN_GAP * 2;
    return Math.max(88, Math.floor(afterGaps / 3));
  }, [windowWidth]);

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
      if (!q) return true;
      const name = (s.species?.name ?? s.speciesId).toLowerCase();
      return name.includes(q);
    });
  }, [enriched, query]);

  const displayed = useMemo(() => {
    const list = [...filtered];
    if (!sortExpanded) {
      // Collapsed state = default chronological sort.
      list.sort((a, b) => b.acquiredAt - a.acquiredAt);
      return list;
    }
    if (sortBy === 'tier') {
      list.sort((a, b) => {
        const ta = a.species?.tier ?? 999;
        const tb = b.species?.tier ?? 999;
        if (ta !== tb) return ascending ? ta - tb : tb - ta;
        const cmp = (a.species?.name ?? a.speciesId).localeCompare(b.species?.name ?? b.speciesId);
        return ascending ? cmp : -cmp;
      });
      return list;
    }
    list.sort((a, b) => {
      const cmp = (a.species?.name ?? a.speciesId).localeCompare(b.species?.name ?? b.speciesId);
      return ascending ? cmp : -cmp;
    });
    return list;
  }, [ascending, filtered, sortBy, sortExpanded]);

  const selected = useMemo(
    () => enriched.find((s) => s.id === selectedId),
    [enriched, selectedId]
  );

  const cycleSort = () => {
    const idx = SORT_ORDER.indexOf(sortBy);
    setSortBy(SORT_ORDER[(idx + 1) % SORT_ORDER.length] ?? 'name');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
        onScroll={(e) => {
          if (e.nativeEvent.contentOffset.y < 0) {
            scrollRef.current?.scrollTo({ y: 0, animated: false });
          }
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.heroWrap}>
          <View style={styles.heroBandsStack}>
            <View style={styles.heroTopBand} />
            <View style={styles.heroPinkBand} />
            <View style={styles.heroBottomBand} />
            <View style={styles.heroStackDivider}>
              <View style={styles.heroStackDividerTop} />
              <View style={styles.heroStackDividerBottom} />
            </View>
          </View>
          <Image source={SLEEP_TRACKING_LOGO} style={styles.heroSlime} resizeMode="contain" />
        </View>

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <CollectionTitleLabel />
            <View style={styles.blurbRow}>
              <Text style={styles.subtitle}>
                View all of the slimes you’ve collected!
              </Text>
              <Text style={styles.subtitleCount} accessibilityLabel={`${enriched.length} slimes collected`}>
                {enriched.length}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.sectionDivider} />

      <View style={styles.controlsRow}>
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={mainScreens.idle.border}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.sortWrap}>
          <View style={styles.sortControlsRow}>
            {!sortExpanded ? (
              <Pressable
                style={[styles.sortButton, styles.sortButtonCollapsed]}
                onPress={() => setSortExpanded(true)}
                accessibilityRole="button"
                accessibilityLabel="Open sort options"
              >
                <Text style={styles.sortButtonText}>Sort by</Text>
              </Pressable>
            ) : (
              <>
                <Pressable style={[styles.sortButton, styles.sortButtonExpanded]} onPress={cycleSort}>
                  <Text style={styles.sortButtonText}>{SORT_LABEL[sortBy]}</Text>
                </Pressable>
                <Pressable
                  style={styles.sortDirButton}
                  onPress={() => setAscending((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={ascending ? 'Sort ascending' : 'Sort descending'}
                >
                  <Text style={styles.sortDirButtonText}>{ascending ? '↑' : '↓'}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>

      {isLoading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : displayed.length === 0 ? (
        <Text style={styles.empty}>
          {enriched.length === 0
            ? 'No slimes yet. Sleep to spawn some!'
            : 'No slimes match your search.'}
        </Text>
      ) : (
        <View style={styles.grid}>
          {displayed.map((s) => (
            <CollectionSlimeCard
              key={s.id}
              tileWidth={collectionCardWidth}
              speciesId={s.speciesId}
              name={s.species?.name ?? s.speciesId}
              tier={s.species?.tier}
              onPress={() => setSelectedId(s.id)}
            />
          ))}
        </View>
      )}

      </ScrollView>

      {/* {selected && (
        <CollectionSlimeDetailModal
          visible
          onClose={() => setSelectedId(null)}
          slime={{
            speciesId: selected.speciesId,
            acquiredAt: selected.acquiredAt,
            species: selected.species,
          }}
        />
      )} */}
    </View>
  );
}

const styles = createAppStyles({
  screen: {
    flex: 1,
    backgroundColor: mainScreens.idle.bg,
  },
  content: {
    paddingHorizontal: CONTENT_HORIZONTAL_PAD,
    paddingTop: 0,
  },
  heroWrap: {
    marginHorizontal: -CONTENT_HORIZONTAL_PAD,
    minHeight: 204,
    marginBottom: 0,
    position: 'relative',
    overflow: 'visible',
  },
  heroBandsStack: {
    flex: 1,
    width: '100%',
  },
  heroTopBand: {
    height: 110,
    backgroundColor: '#FFFFFF',
  },
  heroPinkBand: {
    height: 66,
    backgroundColor: mainScreens.idle.surface,
  },
  heroBottomBand: {
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  heroStackDivider: {
    gap: 0,
  },
  heroStackDividerTop: {
    width: '100%',
    height: 6,
    borderRadius: 0,
    backgroundColor: mainScreens.idle.surface,
  },
  heroStackDividerBottom: {
    width: '100%',
    height: 10,
    borderRadius: 0,
    backgroundColor: mainScreens.idle.border,
  },
  heroSlime: {
    position: 'absolute',
    alignSelf: 'center',
    top: 30,
    width: 252,
    height: 198,
  },
  titleRow: { marginBottom: 4 },
  blurbRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  titleSvgWrap: {
    alignSelf: 'stretch',
    minHeight: TITLE_HEIGHT,
    marginBottom: -10,
  },
  subtitle: {
    flex: 1,
    fontSize: 14,
    color: mainScreens.idle.primaryText,
    lineHeight: 20,
    paddingRight: 0,
  },
  subtitleCount: {
    fontSize: 14,
    color: mainScreens.idle.primaryText,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  sectionDivider: {
    marginHorizontal: -CONTENT_HORIZONTAL_PAD,
    width: '150%',
    height: 2,
    borderRadius: 2,
    backgroundColor: mainScreens.idle.border,
    marginBottom: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 14,
  },
  searchWrap: { flex: 1 },
  searchInput: {
    backgroundColor: mainScreens.idle.surface,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: mainScreens.idle.border,
    height: CONTROL_PILL_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontSize: 24,
    color: mainScreens.idle.primaryText,
  },
  sortWrap: { width: 176 },
  sortControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortButton: {
    height: CONTROL_PILL_HEIGHT,
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: 12,
    backgroundColor: mainScreens.idle.surface,
    borderWidth: 3,
    borderColor: mainScreens.idle.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonCollapsed: { flex: undefined, width: 168 },
  sortButtonExpanded: { width: 120 },
  sortDirButton: {
    width: 50,
    height: CONTROL_PILL_HEIGHT,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mainScreens.idle.surface,
    borderWidth: 3,
    borderColor: mainScreens.idle.border,
  },
  sortButtonText: { fontSize: 24, fontWeight: '700', color: mainScreens.idle.border },
  sortDirButtonText: {
    fontSize: 42,
    fontWeight: '800',
    color: mainScreens.idle.border,
    /** Match pill inner height (~48 − 2×border) so ↑/↓ center; must be ≥ fontSize. */
    lineHeight: CONTROL_PILL_HEIGHT - 6,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  empty: { fontSize: 15, color: mainScreens.idle.border, marginTop: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GRID_COLUMN_GAP,
    rowGap: GRID_ROW_GAP,
  },
});
