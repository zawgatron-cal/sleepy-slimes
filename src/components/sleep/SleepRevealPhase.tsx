/**
 * Slime reveal phase — visually aligned with summary screen.
 */

import { useEffect, useRef } from 'react';
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
import { HexTileBackground } from '@/src/components/HexTileBackground';
import { SUMMARY_BACKGROUND_TILE } from '@/src/constants/summaryScreenAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { OutlinedSvgLabel } from '@/src/components/OutlinedSvgLabel';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';
import { resolveTierGradientFromLabel } from '@/src/theme/tierAccents';

const t = mainScreens.sleep.summary;
const SUMMARY_HEX_TILES_ACROSS = 3;
const SUMMARY_HEX_OPACITY = 0.55;
const STATS_FONT_SIZE = 28;
const STATS_LINE_HEIGHT = 42;
const STATS_STROKE_WIDTH = 2.4;
const STATS_STROKE = t.titleStroke;
const STATS_FILL = t.titleFill;
const NAME_STROKE = t.nameStroke;
const NAME_FILL = t.nameFill;
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

  const revealCardHeight = Math.min(470, Math.max(360, winH * 0.48));

  return (
    <View style={styles.root}>
      <HexTileBackground
        width={winW}
        height={winH}
        tileSource={SUMMARY_BACKGROUND_TILE}
        tilesAcross={SUMMARY_HEX_TILES_ACROSS}
        opacity={SUMMARY_HEX_OPACITY}
      />

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
  return (
    <OutlinedSvgLabel
      text={text}
      fit="sleepRevealSpeciesName"
      strokeColor={NAME_STROKE}
      fillColor={NAME_FILL}
      strokeWidth={NAME_STROKE_WIDTH}
      style={styles.speciesNameWrap}
      defaultWidth={280}
    />
  );
}

function GradientTierText({ text }: { text: string }) {
  const g = resolveTierGradientFromLabel(text);
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

const styles = createAppStyles({
  root: {
    flex: 1,
    backgroundColor: t.bg,
    overflow: 'hidden',
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
    borderColor: t.border,
    backgroundColor: t.surface,
    padding: 28,
  },
  innerPanel: {
    height: '100%',
    borderRadius: 22,
    backgroundColor: t.innerPanel,
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
    backgroundColor: t.surface,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 6,
    borderColor: t.revealCtaBorder,
  },
  ctaPressed: {
    backgroundColor: t.ctaPressed,
  },
  ctaText: {
    color: t.revealCtaText,
    fontSize: 36,
    fontWeight: '800',
  },
});
