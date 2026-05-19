/**
 * Slimepedia — species catalog grouped by themed sets.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getSpecies, getSlimes } from '@/src/db';
import {
  SetId,
  SLIMEPEDIA_SET_LABELS,
  SLIMEPEDIA_SET_ORDER,
} from '@/src/constants/game';
import type { Species } from '@/src/types';
import slimepediaData from '@/src/data/slimepedia.json';
import { SlimepediaEntryCard, SlimepediaSpeciesModal } from '@/src/components';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';
import { SLIMEPEDIA_BORDER_DECAL } from '@/src/constants/slimepediaAssets';

const TITLE_LABEL = 'Slimepedia';
const TITLE_FONT = 60;
const TITLE_STROKE = 2.2;
/** Fixed SVG canvas — layout does not change when you tune the baseline. */
const TITLE_VIEWPORT_HEIGHT = 96;
/** Glyph position inside the canvas only (higher = lower within the overlay). */
const TITLE_BASELINE_Y = 82;
/** Distance from top of header stack to the title overlay box. */
const TITLE_OVERLAY_TOP = 36;
/** Min height of the white back-button band above the decal. */
const WHITE_HEADER_MIN_HEIGHT = 120;
const CONTENT_HORIZONTAL_PAD = 16;
const GRID_COLUMNS = 5;
const GRID_GAP = 8;
const SET_CONTAINER_PAD = 12;
const DECAL_ASPECT = 1608 / 407;
/** How much of the decal height set content may cover (separate layers). */
const DECAL_CONTENT_OVERLAP_RATIO = 0.5;

function SlimepediaTitleLabel() {
  const defaultW = Math.min(360, Math.max(180, Dimensions.get('window').width - 56));
  const [w, setW] = useState(defaultW);
  return (
    <View
      style={styles.titleSvgWrap}
      onLayout={(e) => {
        const nextW = Math.floor(e.nativeEvent.layout.width);
        if (nextW > 0 && nextW !== w) setW(nextW);
      }}
    >
      <Svg width={w} height={TITLE_VIEWPORT_HEIGHT}>
        <SvgText
          x={w / 2}
          y={TITLE_BASELINE_Y}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={TITLE_FONT}
          fontWeight="900"
          stroke={mainScreens.slimepedia.titleStroke}
          strokeWidth={TITLE_STROKE}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {TITLE_LABEL}
        </SvgText>
        <SvgText
          x={w / 2}
          y={TITLE_BASELINE_Y}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={TITLE_FONT}
          fontWeight="900"
          fill={mainScreens.slimepedia.titleFill}
        >
          {TITLE_LABEL}
        </SvgText>
      </Svg>
    </View>
  );
}

function sortSpeciesInSet(a: Species, b: Species): number {
  if (a.tier !== b.tier) return a.tier - b.tier;
  return a.name.localeCompare(b.name);
}

/** Pad the last row with `null` so the grid always fills complete rows of `columns`. */
function padGridSlots<T>(items: T[], columns: number): (T | null)[] {
  if (items.length === 0) return items;
  const remainder = items.length % columns;
  if (remainder === 0) return items;
  return [...items, ...Array(columns - remainder).fill(null)];
}

export default function SlimepediaScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [species, setSpecies] = useState<Species[]>([]);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scrollWidth, setScrollWidth] = useState(() => Dimensions.get('window').width);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [spec, slimes] = await Promise.all([getSpecies(), getSlimes()]);
        if (cancelled) return;
        setSpecies(spec);
        setDiscoveredIds(new Set(slimes.map((s) => s.speciesId)));
      } catch (e) {
        console.warn('Slimepedia load failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const speciesBySet = useMemo(() => {
    const bySet: Partial<Record<SetId, Species[]>> = {};
    for (const s of species) {
      if (s.setId === SetId.NONE) continue;
      const bucket = (bySet[s.setId] ??= []);
      bucket.push(s);
    }
    for (const list of Object.values(bySet)) {
      list?.sort(sortSpeciesInSet);
    }
    return bySet;
  }, [species]);

  const cellSize = useMemo(() => {
    const rowInner =
      windowWidth - CONTENT_HORIZONTAL_PAD * 2 - SET_CONTAINER_PAD * 2;
    const gaps = GRID_GAP * (GRID_COLUMNS - 1);
    return Math.max(48, Math.floor((rowInner - gaps) / GRID_COLUMNS));
  }, [windowWidth]);

  const selectedSpecies = useMemo(
    () => species.find((s) => s.id === selectedId) ?? null,
    [species, selectedId],
  );

  const selectedPedia = selectedSpecies
    ? (slimepediaData as Record<string, { fusionHint?: string; description?: string }>)[
        selectedSpecies.id
      ] ?? {}
    : {};

  const decalHeight = scrollWidth > 0 ? Math.round(scrollWidth / DECAL_ASPECT) : 0;
  const decalContentOverlap =
    decalHeight > 0 ? Math.round(decalHeight * DECAL_CONTENT_OVERLAP_RATIO) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        onLayout={(e) => {
          const w = Math.floor(e.nativeEvent.layout.width);
          if (w > 0 && w !== scrollWidth) setScrollWidth(w);
        }}
        contentContainerStyle={[
          styles.content,
          scrollWidth > 0 ? { width: scrollWidth } : null,
        ]}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <View style={[styles.headerStack, scrollWidth > 0 ? { width: scrollWidth } : null]}>
          <View style={styles.headerTopBar}>
            <View style={styles.backRow}>
              <Pressable
                style={styles.backBtn}
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.titleOverlay} pointerEvents="none">
            <SlimepediaTitleLabel />
          </View>
        </View>

        <View style={[styles.body, scrollWidth > 0 ? { width: scrollWidth } : null]}>
          {scrollWidth > 0 && decalHeight > 0 ? (
            <View
              style={[styles.decalWrap, { width: scrollWidth, height: decalHeight }]}
              pointerEvents="none"
            >
              <Image
                source={SLIMEPEDIA_BORDER_DECAL}
                style={{ width: scrollWidth, height: decalHeight }}
                resizeMode="stretch"
                accessibilityIgnoresInvertColors
              />
            </View>
          ) : null}
          <View
            style={[
              styles.bodyContent,
              decalContentOverlap > 0 ? { marginTop: -decalContentOverlap } : null,
            ]}
          >
          {SLIMEPEDIA_SET_ORDER.map((setId) => {
          const list = speciesBySet[setId] ?? [];
          const discoveredCount = list.filter((s) => discoveredIds.has(s.id)).length;
          const total = list.length;

          return (
            <View key={setId} style={styles.setSection}>
              <View style={styles.setHeaderRow}>
                <Text style={styles.setTitle}>{SLIMEPEDIA_SET_LABELS[setId]}</Text>
                <Text style={styles.setProgress} accessibilityLabel={`${discoveredCount} of ${total} discovered`}>
                  {discoveredCount}/{total}
                </Text>
              </View>

              <View style={styles.setContainer}>
                {total === 0 ? (
                  <Text style={styles.setEmpty}>Coming soon</Text>
                ) : (
                  <View style={styles.grid}>
                    {padGridSlots(list, GRID_COLUMNS).map((slot, index) =>
                      slot == null ? (
                        <SlimepediaEntryCard
                          key={`${setId}-pad-${index}`}
                          cellSize={cellSize}
                          placeholder
                        />
                      ) : (
                        <SlimepediaEntryCard
                          key={slot.id}
                          cellSize={cellSize}
                          species={slot}
                          discovered={discoveredIds.has(slot.id)}
                          onPress={() => setSelectedId(slot.id)}
                        />
                      ),
                    )}
                  </View>
                )}
              </View>
            </View>
          );
          })}
          </View>
        </View>
      </ScrollView>
      </View>

      {selectedSpecies && (
        <SlimepediaSpeciesModal
          visible
          onClose={() => setSelectedId(null)}
          species={selectedSpecies}
          description={selectedPedia.description ?? 'No description yet.'}
          fusionHint={selectedPedia.fusionHint ?? 'No fusion hint yet.'}
        />
      )}
    </SafeAreaView>
  );
}

const pedia = mainScreens.slimepedia;

const styles = createAppStyles({
  safeArea: {
    flex: 1,
    backgroundColor: pedia.contentWhite,
  },
  container: {
    flex: 1,
    backgroundColor: pedia.contentWhite,
  },
  scroll: {
    flex: 1,
    backgroundColor: pedia.contentWhite,
  },
  content: {
    paddingTop: 0,
    paddingBottom: 32,
    overflow: 'visible',
  },
  headerStack: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
  },
  headerTopBar: {
    backgroundColor: pedia.contentWhite,
    paddingHorizontal: CONTENT_HORIZONTAL_PAD,
    paddingTop: 8,
    paddingBottom: 20,
    minHeight: WHITE_HEADER_MIN_HEIGHT,
    zIndex: 0,
  },
  backRow: {
    position: 'relative',
    zIndex: 12,
    elevation: 12,
    alignSelf: 'flex-start',
  },
  titleOverlay: {
    position: 'absolute',
    top: TITLE_OVERLAY_TOP,
    left: 0,
    right: 0,
    height: TITLE_VIEWPORT_HEIGHT,
    zIndex: 10,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  body: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: pedia.bg,
    overflow: 'visible',
  },
  decalWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  bodyContent: {
    position: 'relative',
    zIndex: 1,
    elevation: 1,
    paddingTop: 90,
    paddingHorizontal: CONTENT_HORIZONTAL_PAD,
  },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingRight: 12 },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: pedia.setChrome,
  },
  titleSvgWrap: {
    width: '100%',
    height: TITLE_VIEWPORT_HEIGHT,
  },
  setSection: { marginBottom: 20 },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  setTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: pedia.setChrome,
  },
  setProgress: {
    fontSize: 20,
    fontWeight: '800',
    color: pedia.setChrome,
    fontVariant: ['tabular-nums'],
  },
  setContainer: {
    backgroundColor: pedia.setChrome,
    borderRadius: 16,
    padding: SET_CONTAINER_PAD,
    minHeight: 72,
    justifyContent: 'center',
  },
  setEmpty: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: pedia.ledge,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GRID_GAP,
    rowGap: GRID_GAP,
  },
});
