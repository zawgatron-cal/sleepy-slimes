import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { ZONES } from '@/src/data';
import { GRASSY_MEADOW_WORLD } from '@/src/constants/sleepIdleAssets';
import type { Zone } from '@/src/types';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const SLEEP_DATA_LABEL = 'Sleep Data';
const SLEEP_DATA_LABEL_FONT = 24;
const SLEEP_DATA_LABEL_HEIGHT = 34;
const SLEEP_CTA_LABEL = 'Sleep';
const SLEEP_CTA_LABEL_FONT = 38;
const SLEEP_CTA_LABEL_HEIGHT = 48;

function getZoneWorldImage(zoneId: string) {
  switch (zoneId) {
    case ZONES.GRASSY_MEADOW.id:
      return GRASSY_MEADOW_WORLD;
    default:
      return GRASSY_MEADOW_WORLD;
  }
}

export function SleepDataPillLabel() {
  const [w, setW] = useState(120);
  const cx = w / 2;
  const baselineY = 26;

  return (
    <View
      style={styles.sleepDataSvgWrap}
      onLayout={(e) => {
        const nextW = Math.floor(e.nativeEvent.layout.width);
        if (nextW > 0 && nextW !== w) setW(nextW);
      }}
    >
      <Svg width={w} height={SLEEP_DATA_LABEL_HEIGHT}>
        <SvgText
          x={cx}
          y={baselineY}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={SLEEP_DATA_LABEL_FONT}
          fontWeight="900"
          stroke={mainScreens.idle.specialTextBorder}
          strokeWidth={1.5}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {SLEEP_DATA_LABEL}
        </SvgText>
        <SvgText
          x={cx}
          y={baselineY}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={SLEEP_DATA_LABEL_FONT}
          fontWeight="900"
          fill={mainScreens.idle.specialTextFill}
        >
          {SLEEP_DATA_LABEL}
        </SvgText>
      </Svg>
    </View>
  );
}

export function SleepCtaLabel() {
  const [w, setW] = useState(180);
  const cx = w / 2;
  const baselineY = 38;

  return (
    <View
      style={styles.sleepCtaSvgWrap}
      onLayout={(e) => {
        const nextW = Math.floor(e.nativeEvent.layout.width);
        if (nextW > 0 && nextW !== w) setW(nextW);
      }}
    >
      <Svg width={w} height={SLEEP_CTA_LABEL_HEIGHT}>
        <SvgText
          x={cx}
          y={baselineY}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={SLEEP_CTA_LABEL_FONT}
          fontWeight="900"
          stroke={mainScreens.idle.specialTextBorder}
          strokeWidth={1.8}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {SLEEP_CTA_LABEL}
        </SvgText>
        <SvgText
          x={cx}
          y={baselineY}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={SLEEP_CTA_LABEL_FONT}
          fontWeight="900"
          fill={mainScreens.idle.specialTextFill}
        >
          {SLEEP_CTA_LABEL}
        </SvgText>
      </Svg>
    </View>
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

export function SleepZonePreview({ zone, zoneImageHeight, onPress }: SleepZonePreviewProps) {
  return (
    <View style={styles.idleZoneBlock}>
      <Text style={styles.zoneSectionLabel}>Sleep zone</Text>
      <Pressable
        onPress={onPress}
        disabled={!zone.unlockedByDefault}
        style={[
          styles.zoneImageCard,
          { height: zoneImageHeight },
          !zone.unlockedByDefault && styles.zoneImageCardLocked,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${zone.name}. ${zone.effect}`}
      >
        <Image source={getZoneWorldImage(zone.id)} style={styles.zoneImage} resizeMode="contain" />
      </Pressable>
      <Text style={styles.zoneCaption} numberOfLines={1}>
        {zone.name}
      </Text>
      <Text style={styles.zoneEffectLine} numberOfLines={2}>
        {zone.unlockedByDefault ? zone.effect : 'Locked'}
      </Text>
    </View>
  );
}

type SleepZoneSelectPanelProps = {
  zones: Zone[];
  selectedZoneId: string;
  zoneImageHeight: number;
  windowWidth: number;
  onSelectZone: (zoneId: string) => void;
};

export function SleepZoneSelectPanel({
  zones,
  selectedZoneId,
  zoneImageHeight,
  windowWidth,
  onSelectZone,
}: SleepZoneSelectPanelProps) {
  const zoneList = zones.length > 0 ? zones : [ZONES.GRASSY_MEADOW];

  return (
    <View style={styles.zoneSelectContainer}>
      <View style={styles.zoneSelectHeader}>
        <Text style={styles.zoneSelectTitle}>Select Sleep Zone</Text>
      </View>
      <ScrollView
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
                { width: Math.min(windowWidth - 40, 360) },
                selected && styles.zoneSelectCardSelected,
                !unlocked && styles.zoneImageCardLocked,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${zone.name}. ${zone.effect}`}
            >
              <Image
                source={getZoneWorldImage(zone.id)}
                style={[styles.zoneSelectImage, { height: zoneImageHeight }]}
                resizeMode="contain"
              />
              <Text style={styles.zoneSelectCardTitle} numberOfLines={1}>
                {zone.name}
              </Text>
              <Text style={styles.zoneSelectCardEffect} numberOfLines={2}>
                {unlocked ? zone.effect : 'Locked'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
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
    borderColor: mainScreens.idle.borderOne,
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
    borderColor: mainScreens.idle.borderOne,
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
  zoneSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  zoneImageCard: {
    alignSelf: 'stretch',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  zoneImageCardLocked: {
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
  zoneEffectLine: {
    fontSize: 13,
    color: mainScreens.idle.borderOne,
    marginBottom: 0,
    lineHeight: 18,
    flexShrink: 0,
  },
  zoneSelectContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 16,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  zoneSelectHeader: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  zoneSelectTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    textAlign: 'center',
  },
  zoneSelectScroll: {
    width: '100%',
  },
  zoneSelectScroller: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    gap: 14,
  },
  zoneSelectCard: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  zoneSelectCardSelected: {
    opacity: 0.88,
  },
  zoneSelectImage: {
    width: '100%',
    backgroundColor: mainScreens.idle.bg,
    borderRadius: 12,
    marginBottom: 8,
  },
  zoneSelectCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    marginBottom: 2,
    textAlign: 'center',
  },
  zoneSelectCardEffect: {
    fontSize: 12,
    color: mainScreens.idle.borderOne,
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
