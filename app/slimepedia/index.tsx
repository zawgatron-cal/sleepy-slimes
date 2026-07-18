/**
 * Slimepedia — species catalog grouped by themed sets.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getSpecies, getSlimepediaDiscoveredSpeciesIds } from '@/src/db';
import { SetId, SLIMEPEDIA_SETS } from '@/src/constants/game';
import { TUTORIAL_TAP } from '@/src/constants/tutorial';
import type { Species } from '@/src/types';
import { OutlinedSvgLabel, SlimepediaEntryCard, TutorialTapPrompt } from '@/src/components';
import { useDevSettingsStore } from '@/src/stores/useDevSettingsStore';
import { useTutorialStore } from '@/src/stores';
import { isSlimepediaSpeciesDiscovered } from '@/src/utils/slimepediaDiscovery';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
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

  return (
    <OutlinedSvgLabel
      text={TITLE_LABEL}
      fontSize={TITLE_FONT}
      height={TITLE_VIEWPORT_HEIGHT}
      baselineY={TITLE_BASELINE_Y}
      strokeWidth={TITLE_STROKE}
      strokeColor={mainScreens.slimepedia.titleStroke}
      fillColor={mainScreens.slimepedia.titleFill}
      style={styles.titleSvgWrap}
      defaultWidth={defaultW}
    />
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
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);
  const screenRef = useRef<View>(null);
  const backButtonRef = useRef<View>(null);
  const { width: windowWidth } = useWindowDimensions();
  const zoneUnlockTutorialPhase = useTutorialStore((s) => s.zoneUnlockTutorialPhase);
  const setZoneUnlockTutorialPhase = useTutorialStore((s) => s.setZoneUnlockTutorialPhase);
  const showSlimepediaBackTutorial = zoneUnlockTutorialPhase === 'slimepedia_back';
  const [backTapRect, setBackTapRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [species, setSpecies] = useState<Species[]>([]);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(() => new Set());
  const [scrollWidth, setScrollWidth] = useState(() => Dimensions.get('window').width);
  const unlockSlimepedia = useDevSettingsStore((s) => s.unlockSlimepedia);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [spec, discovered] = await Promise.all([
          getSpecies(),
          getSlimepediaDiscoveredSpeciesIds(),
        ]);
        if (cancelled) return;
        setSpecies(spec);
        setDiscoveredIds(new Set(discovered));
      } catch (e) {
        console.warn('Slimepedia load failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void getSlimepediaDiscoveredSpeciesIds()
        .then((discovered) => {
          if (!cancelled) setDiscoveredIds(new Set(discovered));
        })
        .catch((e) => console.warn('Slimepedia discovery refresh failed', e));
      return () => {
        cancelled = true;
      };
    }, [])
  );

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

  const decalHeight = scrollWidth > 0 ? Math.round(scrollWidth / DECAL_ASPECT) : 0;
  const decalContentOverlap =
    decalHeight > 0 ? Math.round(decalHeight * DECAL_CONTENT_OVERLAP_RATIO) : 0;

  const updateBackTapPos = useCallback(() => {
    if (!showSlimepediaBackTutorial || !backButtonRef.current || !screenRef.current) return;
    // measureLayout ignores ScrollView offset — measureInWindow tracks the visible button.
    backButtonRef.current.measureInWindow((buttonX, buttonY, width, height) => {
      if (width <= 0 || height <= 0) {
        setBackTapRect(null);
        return;
      }
      screenRef.current?.measureInWindow((screenX, screenY) => {
        setBackTapRect({
          x: buttonX - screenX,
          y: buttonY - screenY,
          width,
          height,
        });
      });
    });
  }, [showSlimepediaBackTutorial]);

  useEffect(() => {
    if (!showSlimepediaBackTutorial) {
      setBackTapRect(null);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tryMeasure = () => {
      if (cancelled) return;
      updateBackTapPos();
      if (attempts < 10) {
        attempts += 1;
        setTimeout(tryMeasure, 100);
      }
    };
    const timer = setTimeout(tryMeasure, 80);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showSlimepediaBackTutorial, updateBackTapPos]);

  const handleBackPress = useCallback(() => {
    if (showSlimepediaBackTutorial) {
      setZoneUnlockTutorialPhase('zone_preview');
    }
    router.back();
  }, [showSlimepediaBackTutorial, setZoneUnlockTutorialPhase, router]);

  return (
    <View ref={screenRef} style={styles.container} collapsable={false}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        onLayout={(e) => {
          const w = Math.floor(e.nativeEvent.layout.width);
          if (w > 0 && w !== scrollWidth) setScrollWidth(w);
          updateBackTapPos();
        }}
        onScroll={updateBackTapPos}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          scrollWidth > 0 ? { width: scrollWidth } : null,
        ]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        directionalLockEnabled
        contentInsetAdjustmentBehavior="never"
      >
        <View
          style={[
            styles.headerStack,
            { paddingTop: insets.top },
            scrollWidth > 0 ? { width: scrollWidth } : null,
          ]}
        >
          <View style={styles.headerTopBar}>
            <View style={styles.backRow}>
              <View ref={backButtonRef} collapsable={false} onLayout={updateBackTapPos}>
                <Pressable
                  style={styles.backBtn}
                  onPress={handleBackPress}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Text style={styles.backText}>← Back</Text>
                </Pressable>
              </View>
            </View>
          </View>
          <View
            style={[styles.titleOverlay, { top: insets.top + TITLE_OVERLAY_TOP }]}
            pointerEvents="none"
          >
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
          {SLIMEPEDIA_SETS.map(({ id: setId, label }) => {
          const list = speciesBySet[setId] ?? [];
          const total = list.length;
          const discoveredCount = unlockSlimepedia && __DEV__
            ? total
            : list.filter((s) => discoveredIds.has(s.id)).length;

          return (
            <View key={setId} style={styles.setSection}>
              <View style={styles.setHeaderRow}>
                <Text style={styles.setTitle}>{label}</Text>
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
                          discovered={isSlimepediaSpeciesDiscovered(slot.id, discoveredIds)}
                          onPress={() => router.push(`/slimepedia/${slot.id}`)}
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

      <View style={styles.tutorialTapLayer} pointerEvents="box-none">
        <TutorialTapPrompt
          visible={showSlimepediaBackTutorial}
          label={TUTORIAL_TAP.slimepediaBack}
          targetRect={backTapRect ?? undefined}
          handSize={22}
          labelMinWidth={108}
          labelPosition="below"
          style={backTapRect ? undefined : { top: insets.top + 8, left: 16 }}
        />
      </View>
    </View>
  );
}

const pedia = mainScreens.slimepedia;

const styles = createAppStyles({
  container: {
    flex: 1,
    backgroundColor: pedia.bg,
    position: 'relative',
  },
  tutorialTapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    overflow: 'visible',
  },
  scroll: {
    flex: 1,
    backgroundColor: pedia.bg,
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
    backgroundColor: pedia.contentWhite,
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
    color: pedia.setEmptyText,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    columnGap: GRID_GAP,
    rowGap: GRID_GAP,
  },
});
