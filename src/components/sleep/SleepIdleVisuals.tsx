import { useEffect, useRef, useState, type ComponentRef, type RefObject, type ReactNode } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OutlinedSvgLabel } from '@/src/components/OutlinedSvgLabel';
import { ZONES } from '@/src/data';
import { GRASSY_MEADOW_WORLD } from '@/src/constants/sleepIdleAssets';
import type { SleepZoneView } from '@/src/utils/zoneUnlock';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

function getZoneWorldImage(zoneId: string) {
  switch (zoneId) {
    case ZONES.GRASSY_MEADOW.id:
      return GRASSY_MEADOW_WORLD;
    default:
      return GRASSY_MEADOW_WORLD;
  }
}

/** Caption + blurb block under the zone image. */
const ZONE_META_BLOCK_HEIGHT = 68;
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
};

function ZoneLockIcon() {
  return (
    <View style={styles.zoneLockOverlay} pointerEvents="none">
      <Ionicons
        name="lock-closed"
        size={ZONE_LOCK_ICON_SIZE}
        color={mainScreens.idle.border}
      />
    </View>
  );
}

export function SleepZonePreview({ zone, onPress, onPressLocked }: SleepZonePreviewProps) {
  const handlePress = zone.unlocked ? onPress : onPressLocked;

  return (
    <View style={styles.idleZonePreview}>
      <Pressable
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
          style={[styles.zoneImage, !zone.unlocked && styles.zoneImageLocked]}
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
};

const DEFAULT_ZONE_VIEW: SleepZoneView = {
  ...ZONES.GRASSY_MEADOW,
  unlocked: true,
  canUnlock: false,
  nextUnlockCandyCost: null,
  ultraRaresNeeded: 0,
};

export function SleepZoneSelectPanel({
  zones,
  selectedZoneId,
  zoneAreaHeight,
  isOpen = false,
  onSelectZone,
  onPressLockedZone,
  onClose,
}: SleepZoneSelectPanelProps) {
  const { width: windowWidth } = useWindowDimensions();
  const zoneList = zones.length > 0 ? zones : [DEFAULT_ZONE_VIEW];
  const cardWidth = windowWidth;
  const zoneImageHeight = Math.max(100, zoneAreaHeight - ZONE_META_BLOCK_HEIGHT);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isOpen) return;
    const list = zones.length > 0 ? zones : [DEFAULT_ZONE_VIEW];
    const selectedIndex = list.findIndex((z) => z.id === selectedZoneId);
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    const x = Math.max(0, index * cardWidth - (windowWidth - cardWidth) / 2);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x, animated: false });
    });
  }, [isOpen, selectedZoneId, cardWidth, windowWidth, zones]);

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
        style={styles.zoneSelectScroll}
        showsHorizontalScrollIndicator={false}
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
                {!unlocked ? <ZoneLockIcon /> : null}
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
    overflow: 'hidden',
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
