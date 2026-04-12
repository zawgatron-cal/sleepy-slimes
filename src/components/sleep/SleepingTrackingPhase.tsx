/**
 * Full-screen “sleeping” session — tiled background, clock + underline, logo slime, stop CTA.
 */

import { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatTime } from '@/src/utils/sleepScreen';
import { buildPointyTopHexTileLayout } from '@/src/utils/hexTileLayout';
import { SLEEP_TRACKING_LOGO, SLEEP_TRACKING_TILE } from '@/src/constants/sleepTrackingAssets';
import { uiOne } from '@/src/theme/uiOne';
import { createAppStyles } from '@/src/theme/createAppStyles';

/** On-screen tile size = windowWidth / this → ~5 tiles across (hex spacing uses same value). */
const HEX_TILES_ACROSS = 5;
/** Slightly widens horizontal column spacing (still staggered at half pitch). */
const HEX_HORIZONTAL_PITCH_SCALE = 1.14;
/** Flex “remaining space” center sits low vs full-screen center (tall header); nudge logo up. */
const SLIME_VERTICAL_NUDGE = -100;

const s = uiOne.sleepingScreen;

export type SleepingTrackingPhaseProps = {
  currentTime: number;
  trackingDots: string;
  alarmAt: number | null;
  loading: boolean;
  bottomPad: number;
  onStop: () => void;
};

export function SleepingTrackingPhase({
  currentTime,
  trackingDots,
  alarmAt,
  loading,
  bottomPad,
  onStop,
}: SleepingTrackingPhaseProps) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const fade = useRef(new Animated.Value(0)).current;
  const slimeSize = Math.min(220, Math.round(winW * 0.62));

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const displayTilePx = winW / HEX_TILES_ACROSS;
  const hexPlacements = useMemo(
    () =>
      buildPointyTopHexTileLayout(winW, winH, displayTilePx, {
        horizontalPitchScale: HEX_HORIZONTAL_PITCH_SCALE,
      }),
    [winW, winH, displayTilePx]
  );

  const alarmCopy =
    alarmAt && alarmAt > Date.now() ? `Alarm: ${formatTime(alarmAt)}` : 'No alarm';

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.fadeInner, { opacity: fade }]}>
        <View style={[styles.hexLayer, { width: winW, height: winH }]} pointerEvents="none">
          {hexPlacements.map(({ key, left, top }) => (
            <Image
              key={key}
              source={SLEEP_TRACKING_TILE}
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
        <View style={[styles.content, { paddingTop: insets.top + 28 }]}>
        <View style={styles.headerBlock}>
          <View style={styles.clockWrap}>
            <Text style={styles.clock}>{formatTime(currentTime)}</Text>
            <View style={styles.clockUnderline} />
          </View>
          <Text style={styles.trackingLabel}>{`Tracking Sleep${trackingDots}`}</Text>
          <Text style={styles.alarmLine}>{alarmCopy}</Text>
        </View>

        <View style={[styles.slimeArea, { marginTop: SLIME_VERTICAL_NUDGE }]}>
          <Image
            source={SLEEP_TRACKING_LOGO}
            style={{ width: slimeSize, height: slimeSize }}
            resizeMode="contain"
            accessibilityLabel="Sleeping slime"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.stopCta,
            { marginBottom: bottomPad },
            pressed && styles.stopCtaPressed,
          ]}
          onPress={onStop}
          disabled={loading}
        >
          <Text style={styles.stopCtaText}>{loading ? 'Saving…' : 'Stop sleeping'}</Text>
        </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = createAppStyles({
  root: {
    flex: 1,
    backgroundColor: s.tileBaseBg,
    overflow: 'hidden',
  },
  fadeInner: {
    flex: 1,
  },
  hexLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.95,
  },
  hexTile: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerBlock: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
  },
  clockWrap: {
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  clock: {
    fontSize: 80,
    fontWeight: '900',
    color: s.clockSalmon,
    letterSpacing: -0.5,
    lineHeight: 96,
    textAlign: 'center',
  },
  clockUnderline: {
    marginTop: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: s.clockUnderline,
  },
  trackingLabel: {
    fontSize: 38,
    fontWeight: '700',
    color: s.trackingText,
    marginTop: 4,
  },
  alarmLine: {
    fontSize: 20,
    fontWeight: '600',
    color: s.alarmText,
  },
  slimeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopCta: {
    alignSelf: 'stretch',
    backgroundColor: s.stopBg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderWidth: 6,
    borderColor: s.stopBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 0,
    elevation: 6,
  },
  stopCtaPressed: {
    backgroundColor: s.stopBgPressed,
  },
  stopCtaText: {
    color: s.stopText,
    fontSize: 30,
    fontWeight: '800',
  },
});
