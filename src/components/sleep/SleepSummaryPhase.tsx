/**
 * Post-sleep summary — tiled slime-silhouette background (3 across), card + outlined “Summary” title.
 */

import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OutlinedSvgLabel } from '@/src/components/OutlinedSvgLabel';
import { formatSleepDurationSummary } from '@/src/utils/sleepScreen';
import { HexTileBackground } from '@/src/components/HexTileBackground';
import { SUMMARY_BACKGROUND_TILE } from '@/src/constants/summaryScreenAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const t = mainScreens.sleep.summary;

const SUMMARY_HEX_TILES_ACROSS = 3;
const SUMMARY_HEX_OPACITY = 0.55;

const TITLE = 'Summary';
const TITLE_FONT_SIZE = 40;
const TITLE_SVG_HEIGHT = 48;
const TITLE_STROKE_WIDTH = 3;

const TITLE_PAD_X = 4;

function SummaryTitleSvg() {
  const defaultW = Math.min(280, Math.max(160, Dimensions.get('window').width - 80));

  return (
    <OutlinedSvgLabel
      text={TITLE}
      fontSize={TITLE_FONT_SIZE}
      height={TITLE_SVG_HEIGHT}
      baselineY={36}
      strokeWidth={TITLE_STROKE_WIDTH}
      strokeColor={t.titleStroke}
      fillColor={t.titleFill}
      textAnchor="start"
      x={TITLE_PAD_X}
      style={titleStyles.svgWrap}
      defaultWidth={defaultW}
    />
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

  const slimesLabel =
    slimeCount === 1 ? '1 slime came!' : `${slimeCount} slimes came!`;

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
    backgroundColor: t.bg,
    overflow: 'hidden',
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
    backgroundColor: t.surface,
    borderRadius: 28,
    borderWidth: 5,
    borderColor: t.border,
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
