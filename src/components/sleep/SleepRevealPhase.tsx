/**
 * Slime reveal phase — visually aligned with summary screen.
 */

import { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Pressable,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
  Text,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { buildPointyTopHexTileLayout } from '@/src/utils/hexTileLayout';
import { SUMMARY_BACKGROUND_TILE } from '@/src/constants/summaryScreenAssets';
import { uiOne } from '@/src/theme/uiOne';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const t = uiOne.summaryScreen;
const SUMMARY_HEX_TILES_ACROSS = 3;
const SUMMARY_HEX_HORIZONTAL_PITCH_SCALE = 1.14;
const STATS_FONT_SIZE = 28;
const STATS_LINE_HEIGHT = 42;
const STATS_STROKE_WIDTH = 2.4;
const STATS_STROKE = '#C96363';
const STATS_FILL = '#F2A5A6';
const NAME_STROKE = '#A23030';
const NAME_FILL = '#FFE7E7';
const NAME_FONT_MAX = 42;
const NAME_FONT_MIN = 22;
const NAME_LINE_HEIGHT = 54;
const NAME_STROKE_WIDTH = 2.8;

export type SleepRevealPhaseProps = {
  candies: number;
  revealProgress: string;
  speciesName: string;
  tierLabel: string;
  slimeImage: ImageSourcePropType;
  ctaLabel: string;
  onPressCta: () => void;
};

export function SleepRevealPhase({
  candies,
  revealProgress,
  speciesName,
  tierLabel,
  slimeImage,
  ctaLabel,
  onPressCta,
}: SleepRevealPhaseProps) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const displayTilePx = winW / SUMMARY_HEX_TILES_ACROSS;
  const hexPlacements = useMemo(
    () =>
      buildPointyTopHexTileLayout(winW, winH, displayTilePx, {
        horizontalPitchScale: SUMMARY_HEX_HORIZONTAL_PITCH_SCALE,
      }),
    [winW, winH, displayTilePx]
  );

  const revealCardHeight = Math.min(470, Math.max(360, winH * 0.48));

  return (
    <View style={styles.root}>
      <View style={[styles.hexLayer, { width: winW, height: winH }]} pointerEvents="none">
        {hexPlacements.map(({ key, left, top }) => (
          <Image
            key={key}
            source={SUMMARY_BACKGROUND_TILE}
            style={[
              styles.hexTile,
              {
                left,
                top,
                width: displayTilePx,
                height: displayTilePx,
              },
            ]}
            resizeMode="contain"
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.fadeInner,
          {
            opacity: fade,
            paddingTop: insets.top + 18,
            paddingBottom: Math.max(insets.bottom, 16) + 2,
            paddingHorizontal: 28,
          },
        ]}
      >
        <View style={styles.centerColumn}>
          <View style={styles.statsBlock}>
            <OutlinedStatsRow leftText="Candies Collected:" rightText={`${candies} 🍬`} />
            <OutlinedStatsRow leftText="You found a..." rightText={revealProgress} />
          </View>

          <View style={[styles.outerCard, { height: revealCardHeight }]}>
            <View style={styles.innerPanel}>
              <Image source={slimeImage} style={styles.slimeImage} resizeMode="contain" />
              <OutlinedSpeciesName text={speciesName} />
              <GradientTierText text={tierLabel} />
            </View>
          </View>

          <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={onPressCta}>
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function resolveTierGradient(tierLabel: string): { top: string; bottom: string } {
  const s = tierLabel.toLowerCase();
  // Check more specific labels first so substring matches don't collide:
  // "uncommon" includes "common", and "ultra rare" includes "rare".
  if (s.includes('ultra')) return { top: '#FFD58A', bottom: '#FF9E4D' };
  if (s.includes('uncommon')) return { top: '#7BE0FF', bottom: '#3FA8FF' };
  if (s.includes('rare')) return { top: '#C8A4FF', bottom: '#8F67FF' };
  if (s.includes('common')) return { top: '#4EFF92', bottom: '#4EFF92' };
  return { top: '#4EFF92', bottom: '#4EFF92' };
}

type OutlinedStatsRowProps = {
  leftText: string;
  rightText: string;
};

function OutlinedStatsRow({ leftText, rightText }: OutlinedStatsRowProps) {
  const y = STATS_FONT_SIZE + 4;
  return (
    <View style={styles.statsRowSvgWrap}>
      <Svg width="100%" height={STATS_LINE_HEIGHT}>
        <SvgText
          x="0"
          y={y}
          textAnchor="start"
          fontFamily={APP_FONT_FAMILY}
          fontSize={STATS_FONT_SIZE}
          fontWeight="900"
          stroke={STATS_STROKE}
          strokeWidth={STATS_STROKE_WIDTH}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {leftText}
        </SvgText>
        <SvgText
          x="0"
          y={y}
          textAnchor="start"
          fontFamily={APP_FONT_FAMILY}
          fontSize={STATS_FONT_SIZE}
          fontWeight="900"
          fill={STATS_FILL}
        >
          {leftText}
        </SvgText>
        <SvgText
          x="100%"
          y={y}
          textAnchor="end"
          fontFamily={APP_FONT_FAMILY}
          fontSize={STATS_FONT_SIZE}
          fontWeight="900"
          stroke={STATS_STROKE}
          strokeWidth={STATS_STROKE_WIDTH}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {rightText}
        </SvgText>
        <SvgText
          x="100%"
          y={y}
          textAnchor="end"
          fontFamily={APP_FONT_FAMILY}
          fontSize={STATS_FONT_SIZE}
          fontWeight="900"
          fill={STATS_FILL}
        >
          {rightText}
        </SvgText>
      </Svg>
    </View>
  );
}

function OutlinedSpeciesName({ text }: { text: string }) {
  const fontSize = resolveSpeciesNameFontSize(text);
  const y = fontSize + 6;
  return (
    <View style={styles.speciesNameWrap}>
      <Svg width="100%" height={NAME_LINE_HEIGHT}>
        <SvgText
          x="50%"
          y={y}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={fontSize}
          fontWeight="900"
          stroke={NAME_STROKE}
          strokeWidth={NAME_STROKE_WIDTH}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {text}
        </SvgText>
        <SvgText
          x="50%"
          y={y}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={fontSize}
          fontWeight="900"
          fill={NAME_FILL}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
}

function GradientTierText({ text }: { text: string }) {
  const g = resolveTierGradient(text);
  const gradientId = `tier-gradient-${text.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <View style={styles.tierLineWrap}>
      <Svg width="100%" height={42}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={g.top} />
            <Stop offset="100%" stopColor={g.bottom} />
          </LinearGradient>
        </Defs>
        <SvgText
          x="50%"
          y={34}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={30}
          fontWeight="900"
          fill={`url(#${gradientId})`}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
}

function resolveSpeciesNameFontSize(name: string): number {
  const n = name.trim().length;
  if (n <= 10) return NAME_FONT_MAX;
  if (n >= 22) return NAME_FONT_MIN;
  const t = (n - 10) / (22 - 10);
  return Math.round(NAME_FONT_MAX + (NAME_FONT_MIN - NAME_FONT_MAX) * t);
}

const styles = createAppStyles({
  root: {
    flex: 1,
    backgroundColor: t.screenBg,
    overflow: 'hidden',
  },
  hexLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.55,
  },
  hexTile: {
    position: 'absolute',
  },
  fadeInner: {
    flex: 1,
    justifyContent: 'center',
  },
  centerColumn: {
    width: '100%',
    maxWidth: 410,
    alignSelf: 'center',
  },
  statsBlock: {
    zIndex: 3,
  },
  statsRow: {
    marginBottom: 2,
  },
  statsRowBottom: {
    marginBottom: 0,
  },
  statsRowSvgWrap: {
    width: '100%',
    minHeight: STATS_LINE_HEIGHT,
  },
  outerCard: {
    width: '100%',
    zIndex: 1,
    borderRadius: 28,
    borderWidth: 6,
    borderColor: t.cardBorder,
    backgroundColor: '#FCC5C6',
    padding: 28,
  },
  innerPanel: {
    height: '100%',
    borderRadius: 22,
    backgroundColor: '#F49292',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  slimeImage: {
    width: 220,
    height: 220,
    marginBottom: -20,
  },
  speciesNameWrap: {
    width: '100%',
    minHeight: NAME_LINE_HEIGHT,
    marginBottom: -12,
  },
  tierLineWrap: {
    width: '100%',
    minHeight: 42,
  },
  cta: {
    alignSelf: 'center',
    minWidth: 220,
    marginTop: 12,
    backgroundColor: "#FCC5C6",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#F2A5A6',
  },
  ctaPressed: {
    backgroundColor: t.ctaPressed,
  },
  ctaText: {
    color: "#F2A5A6",
    fontSize: 36,
    fontWeight: '800',
  },
});
