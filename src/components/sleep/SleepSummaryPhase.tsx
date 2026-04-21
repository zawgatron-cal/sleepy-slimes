/**
 * Post-sleep summary — tiled slime-silhouette background (3 across), card + outlined “Summary” title.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Text as SvgText } from 'react-native-svg';
import { formatSleepDurationSummary } from '@/src/utils/sleepScreen';
import { buildPointyTopHexTileLayout } from '@/src/utils/hexTileLayout';
import { SUMMARY_BACKGROUND_TILE } from '@/src/constants/summaryScreenAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const t = mainScreens.sleep.summary;

/** Match sleeping screen honeycomb; fewer tiles across = larger motif. */
const SUMMARY_HEX_TILES_ACROSS = 3;
const SUMMARY_HEX_HORIZONTAL_PITCH_SCALE = 1.14;

const TITLE = 'Summary';
const TITLE_FONT_SIZE = 40;
const TITLE_SVG_HEIGHT = 48;
const TITLE_STROKE_WIDTH = 3;

const TITLE_PAD_X = 4;

function SummaryTitleSvg() {
  const defaultW = Math.min(280, Math.max(160, Dimensions.get('window').width - 80));
  const [w, setW] = useState(defaultW);
  const baselineY = 36;

  return (
    <View
      style={titleStyles.svgWrap}
      onLayout={(e) => {
        const nw = Math.floor(e.nativeEvent.layout.width);
        if (nw > 0 && nw !== w) setW(nw);
      }}
    >
      <Svg width={w} height={TITLE_SVG_HEIGHT}>
        <SvgText
          x={TITLE_PAD_X}
          y={baselineY}
          textAnchor="start"
          fontFamily={APP_FONT_FAMILY}
          fontSize={TITLE_FONT_SIZE}
          fontWeight="900"
          stroke={t.titleStroke}
          strokeWidth={TITLE_STROKE_WIDTH}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {TITLE}
        </SvgText>
        <SvgText
          x={TITLE_PAD_X}
          y={baselineY}
          textAnchor="start"
          fontFamily={APP_FONT_FAMILY}
          fontSize={TITLE_FONT_SIZE}
          fontWeight="900"
          fill={t.titleFill}
        >
          {TITLE}
        </SvgText>
      </Svg>
    </View>
  );
}

const titleStyles: { svgWrap: ViewStyle } = {
  svgWrap: {
    alignSelf: 'stretch',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
};

export type SleepSummaryPhaseProps = {
  durationHours: number;
  candies: number;
  slimeCount: number;
  onSeeSlimes: () => void;
};

export function SleepSummaryPhase({
  durationHours,
  candies,
  slimeCount,
  onSeeSlimes,
}: SleepSummaryPhaseProps) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const fade = useRef(new Animated.Value(0)).current;
  const dur = formatSleepDurationSummary(durationHours);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
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

  const slimesLabel =
    slimeCount === 1 ? '1 slime came!' : `${slimeCount} slimes came!`;

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
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            paddingHorizontal: 20,
          },
        ]}
      >
        <View style={styles.centerColumn}>
          <View style={styles.cardStack}>
            <SummaryTitleSvg />
            <View style={styles.card}>
              <Text style={styles.durationLine}>
                You slept for{' '}
                <Text style={styles.durationValue}>{dur.value}</Text> {dur.suffix}.
              </Text>
              <Text style={styles.youGot}>You Got:</Text>
              <Text style={styles.candyLine}>
                <Text style={styles.candyNumber}>{candies}</Text>
                <Text style={styles.candyEmoji}> 🍬</Text>
              </Text>
              <Text style={styles.slimesLine}>{slimesLabel}</Text>
              <Pressable
                style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                onPress={onSeeSlimes}
              >
                <Text style={styles.ctaText}>See Slimes!</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
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
  },
  centerColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStack: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  card: {
    marginTop: -10,
    backgroundColor: t.cardBg,
    borderRadius: 28,
    borderWidth: 5,
    borderColor: t.cardBorder,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
  },
  durationLine: {
    fontSize: 28,
    fontWeight: '700',
    color: t.bodyText,
    marginBottom: 10,
    lineHeight: 34,
  },
  durationValue: {
    fontWeight: '900',
    color: t.durationNumber,
  },
  youGot: {
    fontSize: 30,
    fontWeight: '800',
    color: t.bodyText,
    marginBottom: 8,
  },
  candyLine: {
    marginBottom: 4,
    textAlign: 'center',
  },
  candyNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: t.bodyText,
  },
  candyEmoji: {
    fontSize: 26,
    fontWeight: '800',
  },
  slimesLine: {
    fontSize: 26,
    fontWeight: '800',
    color: t.bodyText,
    marginBottom: 24,
    textAlign: 'center',
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: t.ctaBg,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 6,
    borderColor: t.ctaBorder,
  },
  ctaPressed: {
    backgroundColor: t.ctaPressed,
  },
  ctaText: {
    color: t.ctaText,
    fontSize: 26,
    fontWeight: '800',
  },
});
