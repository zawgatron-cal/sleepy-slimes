import { useCallback, useEffect, useRef, useState, type ComponentRef, type RefObject, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OutlinedSvgLabel } from '@/src/components/OutlinedSvgLabel';
import { TutorialTapPrompt } from '@/src/components/tutorial/TutorialTapPrompt';
import { TUTORIAL_TAP } from '@/src/constants/tutorial';
import { ZONES } from '@/src/data';
import { GRASSY_MEADOW_WORLD, THE_SEA_WORLD } from '@/src/constants/sleepIdleAssets';
import { playUiTap } from '@/src/services/soundEffects';
import type { SleepZoneView } from '@/src/utils/zoneUnlock';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

function getZoneWorldImage(zoneId: string) {
  switch (zoneId) {
    case ZONES.GRASSY_MEADOW.id:
      return GRASSY_MEADOW_WORLD;
    case ZONES.THE_SEA.id:
      return THE_SEA_WORLD;
    default:
      return GRASSY_MEADOW_WORLD;
  }
}

/** Caption + blurb block under the zone image. */
const ZONE_META_BLOCK_HEIGHT = 68;
const ZONE_SELECT_TITLE_LINE_HEIGHT = 22;
const ZONE_SWIPE_HINT_TOP_GAP = 25;
const ZONE_SELECT_ANIM_MS = 300;
const ZONE_SELECT_DOWN_NUDGE = 48;
const ZONE_LOCK_ICON_SIZE = 36;

export function SleepDataPillLabel() {
  return (
    <OutlinedSvgLabel
      text="Sleep Data"
      fontSize={24}
      height={34}
      baselineY={26}
      strokeWidth={1.5}
      strokeColor={mainScreens.idle.specialTextBorder}
      fillColor={mainScreens.idle.specialTextFill}
      style={styles.sleepDataSvgWrap}
      defaultWidth={120}
    />
  );
}

export function SleepCtaLabel() {
  return (
    <OutlinedSvgLabel
      text="Sleep"
      fontSize={38}
      height={48}
      baselineY={38}
      strokeWidth={1.8}
      strokeColor={mainScreens.idle.specialTextBorder}
      fillColor={mainScreens.idle.specialTextFill}
      style={styles.sleepCtaSvgWrap}
      defaultWidth={180}
    />
  );
}

type SleepIdleTopRowProps = {
  onPressSleepData: () => void;
  onPressMenu: () => void;
  menuButtonRef?: RefObject<ComponentRef<typeof Pressable> | null>;
};

export function SleepIdleTopRow({
  onPressSleepData,
  onPressMenu,
  menuButtonRef,
}: SleepIdleTopRowProps) {
  return (
    <View style={styles.idleTopRow}>
      <Pressable
        style={styles.sleepDataPill}
        onPress={onPressSleepData}
        accessibilityRole="button"
        accessibilityLabel="Sleep data"
      >
        <SleepDataPillLabel />
      </Pressable>
      <Pressable
        ref={menuButtonRef}
        style={styles.menuCircle}
        onPress={onPressMenu}
        accessibilityRole="button"
        accessibilityLabel="Menu"
      >
        <View style={styles.menuBars}>
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
        </View>
      </Pressable>
    </View>
  );
}

type SleepZonePreviewProps = {
  zone: SleepZoneView;
  onPress: () => void;
  onPressLocked?: () => void;
  previewRef?: RefObject<ComponentRef<typeof Pressable> | null>;
};

function ZoneLockIcon({ showTutorialHand = false }: { showTutorialHand?: boolean }) {
  return (
    <View style={styles.zoneLockOverlay} pointerEvents="none">
      <View style={styles.zoneLockIconTarget}>
        <Ionicons
          name="lock-closed"
          size={ZONE_LOCK_ICON_SIZE}
          color={mainScreens.idle.border}
        />
        {showTutorialHand ? (
          <View style={styles.tutorialHandOverlay} pointerEvents="none">
            <TutorialTapPrompt visible handSize={22} style={styles.tutorialHandInline} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function SleepZonePreview({ zone, onPress, onPressLocked, previewRef }: SleepZonePreviewProps) {
  const handlePress = zone.unlocked ? onPress : onPressLocked;

  return (
    <View style={styles.idleZonePreview}>
      <Pressable
        ref={previewRef}
        onPress={handlePress}
        disabled={!zone.unlocked && !onPressLocked}
        style={styles.zoneImageCard}
        accessibilityRole="button"
        accessibilityLabel={
          zone.unlocked
            ? `${zone.name}. ${zone.blurb}`
            : `${zone.name}. Locked. ${zone.blurb}`
        }
      >
        <Image
          source={getZoneWorldImage(zone.id)}
          style={[styles.zoneImage, styles.zoneImagePreview, !zone.unlocked && styles.zoneImageLocked]}
          resizeMode="contain"
        />
        {!zone.unlocked ? <ZoneLockIcon /> : null}
      </Pressable>
      <Text style={styles.zoneCaption} numberOfLines={1}>
        {zone.name}
      </Text>
      <Text style={styles.zoneBlurbLine} numberOfLines={2}>
        {zone.blurb}
      </Text>
    </View>
  );
}

type SleepZoneSelectPanelProps = {
  zones: SleepZoneView[];
  selectedZoneId: string;
  zoneAreaHeight: number;
  /** When true, scroll resets to center the selected zone (no remembered offset). */
  isOpen?: boolean;
  onSelectZone: (zoneId: string) => void;
  onPressLockedZone?: (zone: SleepZoneView) => void;
  onClose?: () => void;
  lockedZoneTutorialActive?: boolean;
};

const DEFAULT_ZONE_VIEW: SleepZoneView = {
  ...ZONES.GRASSY_MEADOW,
  unlocked: true,
  canUnlock: false,
  nextUnlockCandyCost: null,
  ultraRaresNeeded: 0,
};

type ZoneSwipeHintProps = {
  side: 'left' | 'right';
  visible: boolean;
  onPress: () => void;
};

function ZoneSwipeHintBubble({ side, visible, onPress }: ZoneSwipeHintProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  if (!visible) return null;

  const nudge = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: side === 'left' ? [0, -3] : [0, 3],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  return (
    <Pressable
      onPress={() => {
        playUiTap();
        onPress();
      }}
      style={[
        styles.zoneSwipeHintBubble,
        side === 'left' ? styles.zoneSwipeHintLeft : styles.zoneSwipeHintRight,
      ]}
      accessibilityRole="button"
      accessibilityLabel={side === 'left' ? 'Previous zone' : 'Next zone'}
      hitSlop={8}
    >
      <Animated.View style={{ opacity, transform: [{ translateX: nudge }] }}>
        <Ionicons
          name={side === 'left' ? 'chevron-back' : 'chevron-forward'}
          size={18}
          color={mainScreens.idle.primaryText}
        />
      </Animated.View>
    </Pressable>
  );
}

export function SleepZoneSelectPanel({
  zones,
  selectedZoneId,
  zoneAreaHeight,
  isOpen = false,
  onSelectZone,
  onPressLockedZone,
  onClose,
  lockedZoneTutorialActive = false,
}: SleepZoneSelectPanelProps) {
  const { width: windowWidth } = useWindowDimensions();
  const zoneList = zones.length > 0 ? zones : [DEFAULT_ZONE_VIEW];
  const cardWidth = windowWidth;
  const zoneImageHeight = Math.max(100, zoneAreaHeight - ZONE_META_BLOCK_HEIGHT);
  const scrollRef = useRef<ScrollView>(null);
  const hasMultipleZones = zoneList.length > 1;
  const selectedIndex = zoneList.findIndex((z) => z.id === selectedZoneId);
  const [visibleIndex, setVisibleIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);
  const [swipeHints, setSwipeHints] = useState({ left: false, right: false });

  const updateSwipeHints = useCallback(
    (scrollX: number, layoutWidth: number, contentWidth: number) => {
      if (!hasMultipleZones) {
        setSwipeHints({ left: false, right: false });
        return;
      }
      setSwipeHints({
        left: scrollX > 12,
        right: scrollX + layoutWidth < contentWidth - 12,
      });
    },
    [hasMultipleZones]
  );

  const scrollToZoneIndex = useCallback(
    (index: number, animated = true) => {
      const clamped = Math.max(0, Math.min(zoneList.length - 1, index));
      scrollRef.current?.scrollTo({ x: clamped * cardWidth, animated });
      setVisibleIndex(clamped);
      setSwipeHints({
        left: clamped > 0,
        right: clamped < zoneList.length - 1,
      });
    },
    [cardWidth, zoneList.length]
  );

  useEffect(() => {
    if (!isOpen || !hasMultipleZones) {
      setSwipeHints({ left: false, right: false });
      return;
    }
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    setVisibleIndex(index);
    setSwipeHints({
      left: index > 0,
      right: index < zoneList.length - 1,
    });
  }, [isOpen, hasMultipleZones, selectedIndex, zoneList.length]);

  useEffect(() => {
    if (!isOpen) return;
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    const x = Math.max(0, index * cardWidth - (windowWidth - cardWidth) / 2);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x, animated: false });
      setVisibleIndex(index);
    });
  }, [isOpen, selectedIndex, cardWidth, windowWidth, zones]);

  const handleZoneScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const pageWidth = Math.max(1, layoutMeasurement.width);
      const index = Math.min(
        zoneList.length - 1,
        Math.max(0, Math.round(contentOffset.x / pageWidth))
      );
      setVisibleIndex(index);
      updateSwipeHints(contentOffset.x, layoutMeasurement.width, contentSize.width);
    },
    [updateSwipeHints, zoneList.length]
  );

  const handlePrevZone = useCallback(() => {
    scrollToZoneIndex(visibleIndex - 1);
  }, [scrollToZoneIndex, visibleIndex]);

  const handleNextZone = useCallback(() => {
    scrollToZoneIndex(visibleIndex + 1);
  }, [scrollToZoneIndex, visibleIndex]);

  useEffect(() => {
    if (!isOpen || !lockedZoneTutorialActive) return;
    const firstLockedIndex = zoneList.findIndex((zone) => !zone.unlocked);
    if (firstLockedIndex < 0) return;
    const timer = setTimeout(() => scrollToZoneIndex(firstLockedIndex, false), 80);
    return () => clearTimeout(timer);
  }, [isOpen, lockedZoneTutorialActive, zoneList, scrollToZoneIndex]);

  return (
    <View style={styles.zoneSelectContainer}>
      {isOpen && onClose ? (
        <Pressable
          style={styles.zoneSelectBackBtn}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Go back to current zone"
        >
          <Ionicons name="chevron-back" size={22} color={mainScreens.idle.primaryText} />
          <Text style={styles.zoneSelectBackText} numberOfLines={1}>
            Back
          </Text>
        </Pressable>
      ) : null}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        style={styles.zoneSelectScroll}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleZoneScroll}
        contentContainerStyle={styles.zoneSelectScroller}
      >
        {zoneList.map((zone) => {
          const unlocked = zone.unlocked;
          const selected = unlocked && selectedZoneId === zone.id;
          return (
            <Pressable
              key={zone.id}
              onPress={() => {
                if (unlocked) onSelectZone(zone.id);
                else onPressLockedZone?.(zone);
              }}
              disabled={!unlocked && !onPressLockedZone}
              style={[
                styles.zoneSelectCard,
                { width: cardWidth },
                selected && styles.zoneSelectCardSelected,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !unlocked }}
              accessibilityLabel={
                unlocked ? `${zone.name}. ${zone.blurb}` : `${zone.name}. Locked. ${zone.blurb}`
              }
            >
              <View style={[styles.zoneSelectImageWrap, { height: zoneImageHeight }]}>
                <Image
                  source={getZoneWorldImage(zone.id)}
                  style={[
                    styles.zoneSelectImage,
                    !unlocked && styles.zoneImageLocked,
                  ]}
                  resizeMode="contain"
                />
                {!unlocked ? (
                  <ZoneLockIcon showTutorialHand={lockedZoneTutorialActive} />
                ) : null}
              </View>
              <Text style={styles.zoneSelectCardTitle} numberOfLines={1}>
                {zone.name}
              </Text>
              <Text style={styles.zoneSelectCardBlurb} numberOfLines={2}>
                {zone.blurb}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {hasMultipleZones ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.zoneSwipeHintLayer,
            { top: zoneImageHeight + ZONE_SELECT_TITLE_LINE_HEIGHT + ZONE_SWIPE_HINT_TOP_GAP },
          ]}
        >
          <ZoneSwipeHintBubble side="left" visible={swipeHints.left} onPress={handlePrevZone} />
          <ZoneSwipeHintBubble side="right" visible={swipeHints.right} onPress={handleNextZone} />
          {lockedZoneTutorialActive && swipeHints.left ? (
            <View
              style={[styles.zoneSwipeHintHandBox, styles.zoneSwipeHintHandLeft]}
              pointerEvents="none"
            >
              <TutorialTapPrompt visible handSize={22} style={styles.tutorialHandInline} />
            </View>
          ) : null}
          {lockedZoneTutorialActive && swipeHints.right ? (
            <View
              style={[styles.zoneSwipeHintHandBox, styles.zoneSwipeHintHandRight]}
              pointerEvents="none"
            >
              <TutorialTapPrompt visible handSize={22} style={styles.tutorialHandInline} />
            </View>
          ) : null}
          {lockedZoneTutorialActive ? (
            <View style={styles.zoneSwipeTutorialLabel} pointerEvents="none">
              <Text style={styles.zoneSwipeTutorialLabelText}>
                {TUTORIAL_TAP.zoneSwipeArrow}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type SleepIdleZoneAreaProps = {
  zoneSelectOpen: boolean;
  zones: SleepZoneView[];
  selectedZoneId: string;
  bottomInset?: number;
  onOpenZoneSelect: () => void;
  onCloseZoneSelect: () => void;
  onSelectZone: (zoneId: string) => void;
  onPressLockedZone?: (zone: SleepZoneView) => void;
  zonePreviewRef?: RefObject<ComponentRef<typeof Pressable> | null>;
  lockedZoneTutorialActive?: boolean;
  renderTopRow: () => ReactNode;
  renderFooter: () => ReactNode;
};

/** Animated handoff between the idle zone preview and the horizontal zone picker. */
export function SleepIdleZoneArea({
  zoneSelectOpen,
  zones,
  selectedZoneId,
  bottomInset = 0,
  onOpenZoneSelect,
  onCloseZoneSelect,
  onSelectZone,
  onPressLockedZone,
  zonePreviewRef,
  lockedZoneTutorialActive = false,
  renderTopRow,
  renderFooter,
}: SleepIdleZoneAreaProps) {
  const { width: windowWidth } = useWindowDimensions();
  const progress = useRef(new Animated.Value(zoneSelectOpen ? 1 : 0)).current;
  const [zoneAreaHeight, setZoneAreaHeight] = useState(0);
  const [topBarHeight, setTopBarHeight] = useState(0);
  const [bottomBarHeight, setBottomBarHeight] = useState(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: zoneSelectOpen ? 1 : 0,
      duration: ZONE_SELECT_ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [zoneSelectOpen, progress]);

  const displayZone =
    zones.find((z) => z.id === selectedZoneId && z.unlocked) ??
    zones.find((z) => z.id === ZONES.GRASSY_MEADOW.id) ??
    zones.find((z) => z.unlocked) ??
    zones[0];

  const chromeOpacity = progress.interpolate({
    inputRange: [0, 0.45],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const previewOpacity = progress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 0.12, 0],
    extrapolate: 'clamp',
  });

  const selectOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.35, 1],
    extrapolate: 'clamp',
  });

  const previewTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ZONE_SELECT_DOWN_NUDGE],
  });

  const selectTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [14, ZONE_SELECT_DOWN_NUDGE],
  });

  const selectScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });

  const onZoneAreaLayout = (event: LayoutChangeEvent) => {
    setZoneAreaHeight(event.nativeEvent.layout.height);
  };

  return (
    <View style={styles.idleRoot}>
      <Animated.View
        style={[styles.idleTopBar, { opacity: chromeOpacity }]}
        onLayout={(event) => setTopBarHeight(event.nativeEvent.layout.height)}
        pointerEvents={zoneSelectOpen ? 'none' : 'auto'}
      >
        {renderTopRow()}
      </Animated.View>

      <Animated.View
        style={[styles.idleBottomBar, { paddingBottom: bottomInset, opacity: chromeOpacity }]}
        onLayout={(event) => setBottomBarHeight(event.nativeEvent.layout.height)}
        pointerEvents={zoneSelectOpen ? 'none' : 'auto'}
      >
        {renderFooter()}
      </Animated.View>

      <View
        style={[
          styles.zoneAreaShell,
          { top: topBarHeight, bottom: bottomBarHeight },
        ]}
        onLayout={onZoneAreaLayout}
      >
        {displayZone != null ? (
          <Animated.View
            pointerEvents={zoneSelectOpen ? 'none' : 'box-none'}
            style={[
              StyleSheet.absoluteFill,
              styles.previewLayer,
              {
                opacity: previewOpacity,
                transform: [{ translateY: previewTranslateY }],
              },
            ]}
          >
            <SleepZonePreview
              zone={displayZone}
              previewRef={zonePreviewRef}
              onPress={onOpenZoneSelect}
              onPressLocked={onPressLockedZone ? () => onPressLockedZone(displayZone) : undefined}
            />
          </Animated.View>
        ) : null}

        <Animated.View
          pointerEvents={zoneSelectOpen ? 'box-none' : 'none'}
          style={[
            styles.selectLayer,
            {
              width: windowWidth,
              left: -20,
              opacity: selectOpacity,
              transform: [{ translateY: selectTranslateY }, { scale: selectScale }],
            },
          ]}
        >
          <SleepZoneSelectPanel
            zones={zones}
            selectedZoneId={selectedZoneId}
            zoneAreaHeight={zoneAreaHeight}
            isOpen={zoneSelectOpen}
            onSelectZone={onSelectZone}
            onPressLockedZone={onPressLockedZone}
            onClose={onCloseZoneSelect}
            lockedZoneTutorialActive={lockedZoneTutorialActive}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = createAppStyles({
  idleRoot: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  idleTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  idleBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  idleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexShrink: 0,
  },
  sleepDataPill: {
    minHeight: 50,
    minWidth: 120,
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginLeft: -10,
    borderRadius: 12,
    backgroundColor: mainScreens.idle.surface,
    borderWidth: 4,
    borderColor: mainScreens.idle.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepDataSvgWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCircle: {
    width: 50,
    height: 50,
    marginRight: -6,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: mainScreens.idle.border,
    backgroundColor: mainScreens.idle.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBars: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuBar: {
    width: 24,
    height: 3,
    borderRadius: 1,
    backgroundColor: mainScreens.idle.menuIcon,
  },
  idleZonePreview: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  zoneImageCard: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
    borderRadius: 16,
    overflow: 'visible',
    marginBottom: 8,
    position: 'relative',
  },
  zoneImageLocked: {
    opacity: 0.5,
  },
  zoneImage: {
    width: '100%',
    height: '100%',
    backgroundColor: mainScreens.idle.bg,
  },
  zoneImagePreview: {
    transform: [{ scale: 1.3 }],
    backgroundColor: 'transparent',
  },
  zoneCaption: {
    fontSize: 18,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    marginBottom: 4,
    flexShrink: 0,
  },
  zoneBlurbLine: {
    fontSize: 13,
    color: mainScreens.idle.border,
    marginBottom: 0,
    lineHeight: 18,
    flexShrink: 0,
  },
  zoneAreaShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    minHeight: 0,
  },
  previewLayer: {
    justifyContent: 'flex-start',
  },
  selectLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  zoneSelectContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
    justifyContent: 'center',
    position: 'relative',
  },
  zoneSelectBackBtn: {
    position: 'absolute',
    top: -60,
    left: 20,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: mainScreens.idle.surface,
    borderWidth: 4,
    borderColor: mainScreens.idle.border,
  },
  zoneSelectBackText: {
    fontSize: 15,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    maxWidth: 140,
  },
  zoneSelectScroll: {
    width: '100%',
  },
  zoneSwipeHintLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 34,
    zIndex: 2,
  },
  zoneSwipeHintBubble: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mainScreens.idle.surface,
    borderWidth: 3,
    borderColor: mainScreens.idle.border,
    shadowColor: mainScreens.idle.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  zoneSwipeHintLeft: {
    left: 10,
  },
  zoneSwipeHintRight: {
    right: 10,
  },
  tutorialHandOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 30,
  },
  tutorialHandInline: {
    position: 'relative',
  },
  zoneSwipeHintHandBox: {
    position: 'absolute',
    top: -9,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 30,
  },
  zoneSwipeHintHandLeft: {
    left: 1,
  },
  zoneSwipeHintHandRight: {
    right: 1,
  },
  zoneSwipeTutorialLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
  },
  zoneSwipeTutorialLabelText: {
    fontSize: 14,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 248, 248, 0.92)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: mainScreens.idle.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    overflow: 'visible',
  },
  zoneSelectScroller: {
    gap: 0,
  },
  zoneSelectCard: {
    paddingHorizontal: 0,
    alignItems: 'stretch',
  },
  zoneSelectCardSelected: {
    opacity: 0.88,
  },
  zoneSelectImageWrap: {
    width: '100%',
    position: 'relative',
  },
  zoneSelectImage: {
    width: '100%',
    height: '100%',
    backgroundColor: mainScreens.idle.bg,
    borderRadius: 0,
  },
  zoneLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneLockIconTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    width: ZONE_LOCK_ICON_SIZE + 20,
    height: ZONE_LOCK_ICON_SIZE + 20,
  },
  zoneSelectCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    textAlign: 'center',
  },
  zoneSelectCardBlurb: {
    fontSize: 12,
    color: mainScreens.idle.border,
    lineHeight: 16,
    textAlign: 'center',
  },
  sleepCtaSvgWrap: {
    minWidth: 168,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
