import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OutlinedSvgLabel } from '@/src/components/OutlinedSvgLabel';
import { ZONES } from '@/src/data';
import { GRASSY_MEADOW_WORLD } from '@/src/constants/sleepIdleAssets';
import type { Zone } from '@/src/types';
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

/** Caption + blurb block under the zone image (used for centering math). */
const ZONE_META_BLOCK_HEIGHT = 68;
const ZONE_SELECT_ANIM_MS = 300;
/** Push zone picker slightly below vertical center. */
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
};

export function SleepIdleTopRow({ onPressSleepData, onPressMenu }: SleepIdleTopRowProps) {
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
  zone: Zone;
  zoneImageHeight: number;
  onPress: () => void;
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

export function SleepZonePreview({ zone, zoneImageHeight, onPress }: SleepZonePreviewProps) {
  return (
    <View style={styles.idleZoneBlock}>
      <Pressable
        onPress={onPress}
        disabled={!zone.unlockedByDefault}
        style={[styles.zoneImageCard, { height: zoneImageHeight }]}
        accessibilityRole="button"
        accessibilityLabel={
          zone.unlockedByDefault
            ? `${zone.name}. ${zone.blurb}`
            : `${zone.name}. Locked. ${zone.blurb}`
        }
      >
        <Image
          source={getZoneWorldImage(zone.id)}
          style={[
            styles.zoneImage,
            !zone.unlockedByDefault && styles.zoneImageLocked,
          ]}
          resizeMode="contain"
        />
        {!zone.unlockedByDefault ? <ZoneLockIcon /> : null}
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
  zones: Zone[];
  selectedZoneId: string;
  zoneImageHeight: number;
  windowWidth: number;
  edgeToEdge?: boolean;
  /** When true, scroll resets to center the selected zone (no remembered offset). */
  isOpen?: boolean;
  onSelectZone: (zoneId: string) => void;
};

export function SleepZoneSelectPanel({
  zones,
  selectedZoneId,
  zoneImageHeight,
  windowWidth,
  edgeToEdge = false,
  isOpen = false,
  onSelectZone,
}: SleepZoneSelectPanelProps) {
  const zoneList = zones.length > 0 ? zones : [ZONES.GRASSY_MEADOW];
  const cardWidth = edgeToEdge ? windowWidth : windowWidth - 40;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isOpen) return;
    const list = zones.length > 0 ? zones : [ZONES.GRASSY_MEADOW];
    const selectedIndex = list.findIndex((z) => z.id === selectedZoneId);
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    const x = Math.max(0, index * cardWidth - (windowWidth - cardWidth) / 2);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x, animated: false });
    });
  }, [isOpen, selectedZoneId, cardWidth, windowWidth, zones]);

  return (
    <View style={styles.zoneSelectContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        style={styles.zoneSelectScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.zoneSelectScroller}
      >
        {zoneList.map((zone) => {
          const unlocked = zone.unlockedByDefault;
          const selected = unlocked && selectedZoneId === zone.id;
          return (
            <Pressable
              key={zone.id}
              onPress={() => unlocked && onSelectZone(zone.id)}
              disabled={!unlocked}
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
  zones: Zone[];
  selectedZoneId: string;
  zoneImageHeight: number;
  windowWidth: number;
  onOpenZoneSelect: () => void;
  onSelectZone: (zoneId: string) => void;
  renderTopRow: () => ReactNode;
  renderFooter: () => ReactNode;
};

/** Animated handoff between the idle zone preview and the horizontal zone picker. */
export function SleepIdleZoneArea({
  zoneSelectOpen,
  zones,
  selectedZoneId,
  zoneImageHeight,
  windowWidth,
  onOpenZoneSelect,
  onSelectZone,
  renderTopRow,
  renderFooter,
}: SleepIdleZoneAreaProps) {
  const progress = useRef(new Animated.Value(zoneSelectOpen ? 1 : 0)).current;
  const [zoneAreaHeight, setZoneAreaHeight] = useState(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: zoneSelectOpen ? 1 : 0,
      duration: ZONE_SELECT_ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [zoneSelectOpen, progress]);

  const displayZone =
    zones.find((z) => z.id === selectedZoneId) ??
    zones.find((z) => z.id === ZONES.GRASSY_MEADOW.id) ??
    zones[0];

  const previewBlockHeight = zoneImageHeight + ZONE_META_BLOCK_HEIGHT;
  const centerOffset =
    zoneAreaHeight > 0
      ? Math.max(0, (zoneAreaHeight - previewBlockHeight) / 2) + ZONE_SELECT_DOWN_NUDGE
      : ZONE_SELECT_DOWN_NUDGE;

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
    outputRange: [0, centerOffset],
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
    <>
      <Animated.View
        style={{ opacity: chromeOpacity }}
        pointerEvents={zoneSelectOpen ? 'none' : 'auto'}
      >
        {renderTopRow()}
      </Animated.View>

      <View style={styles.zoneAreaShell} onLayout={onZoneAreaLayout}>
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
              zoneImageHeight={zoneImageHeight}
              onPress={onOpenZoneSelect}
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
            zoneImageHeight={zoneImageHeight}
            windowWidth={windowWidth}
            edgeToEdge
            isOpen={zoneSelectOpen}
            onSelectZone={onSelectZone}
          />
        </Animated.View>
      </View>

      <Animated.View
        style={{ opacity: chromeOpacity }}
        pointerEvents={zoneSelectOpen ? 'none' : 'auto'}
      >
        {renderFooter()}
      </Animated.View>
    </>
  );
}

const styles = createAppStyles({
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
  idleZoneBlock: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'flex-start',
  },
  zoneImageCard: {
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
    flex: 1,
    minHeight: 0,
    width: '100%',
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
