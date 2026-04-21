/**
 * Sleep screen — ui-one.pdf flow: idle → modal → tracking → summary → reveal(s).
 */

import { useCallback, useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import {
  View,
  Text,
  Pressable,
  Alert,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cancelAlarm, stopAlarmLoop } from '../../src/services/alarmNotifications';
import { useSleepStore, useCandiesStore, useCollectionStore } from '@/src/stores';
import { useSleepDataLoader, useTrackingPhaseUI, useSleepAlarm } from '@/src/hooks';
import { insertSleepSession, insertSlime } from '@/src/db';
import { computeSleepRewards } from '@/src/services/sleepRewards';
import { refreshSleepStreakFromDb } from '@/src/services/sleepStreakSync';
import { MIN_VALID_SLEEP_SECONDS, TIER_LABELS } from '@/src/constants/game';
import { sortSlimesByTierForReveal } from '@/src/utils/sleepScreen';
import { getAllSlimeImageSources, getSlimeImageSource } from '@/src/utils/slimeAssets';
import {
  SleepModal,
  SleepingTrackingPhase,
  SleepSummaryPhase,
  SleepRevealPhase,
} from '@/src/components';
import { SLEEP_TRACKING_LOGO, SLEEP_TRACKING_TILE } from '@/src/constants/sleepTrackingAssets';
import { SUMMARY_BACKGROUND_TILE } from '@/src/constants/summaryScreenAssets';
import { ZONES } from '@/src/data';
import { GRASSY_MEADOW_WORLD } from '@/src/constants/sleepIdleAssets';
import { uiOne } from '@/src/theme/uiOne';
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

function SleepDataPillLabel() {
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
          stroke="#EA7E7E"
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
          fill="#FFE6E6"
        >
          {SLEEP_DATA_LABEL}
        </SvgText>
      </Svg>
    </View>
  );
}

function SleepCtaLabel() {
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
          stroke="#EA7E7E"
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
          fill="#FFE6E6"
        >
          {SLEEP_CTA_LABEL}
        </SvgText>
      </Svg>
    </View>
  );
}

export default function SleepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const {
    phase,
    selectedZoneId,
    sessionStartedAt,
    alarmAt,
    summaryCandies,
    summaryDurationHours,
    summarySlimes,
    slimesToReveal,
    revealIndex,
    setSelectedZone,
    startSession,
    setPhase,
    setSummaryRewards,
    startReveal,
    nextReveal,
    finishReveal,
    endSession,
    quality,
  } = useSleepStore();
  const addCandies = useCandiesStore((s) => s.add);
  const addSlime = useCollectionStore((s) => s.addSlime);

  const { speciesList, zones } = useSleepDataLoader();
  const { currentTime, trackingDots } = useTrackingPhaseUI(phase);
  useSleepAlarm(phase, alarmAt, currentTime);

  useFocusEffect(
    useCallback(() => {
      void refreshSleepStreakFromDb();
    }, [])
  );

  const [loading, setLoading] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [alarmDate, setAlarmDate] = useState<Date | null>(null);
  const [zoneSelectOpen, setZoneSelectOpen] = useState(false);

  useEffect(() => {
    void Asset.loadAsync([
      SLEEP_TRACKING_TILE,
      SLEEP_TRACKING_LOGO,
      SUMMARY_BACKGROUND_TILE,
      GRASSY_MEADOW_WORLD,
      ...getAllSlimeImageSources(),
    ]);
  }, []);

  useEffect(() => {
    if (!sleepModalVisible) return;
    void Asset.loadAsync([
      SLEEP_TRACKING_TILE,
      SLEEP_TRACKING_LOGO,
      SUMMARY_BACKGROUND_TILE,
      GRASSY_MEADOW_WORLD,
      ...getAllSlimeImageSources(),
    ]);
  }, [sleepModalVisible]);

  const handleStopSleep = async () => {
    if (!sessionStartedAt) return;
    await cancelAlarm();
    stopAlarmLoop();
    const endedAt = Date.now();
    setLoading(true);
    try {
      const result = await computeSleepRewards(
        sessionStartedAt,
        endedAt,
        selectedZoneId,
        quality
      );
      if (!result.valid) {
        Alert.alert(
          'Too short',
          `Sleep at least ${MIN_VALID_SLEEP_SECONDS} seconds. You slept ${Math.floor(result.durationSeconds)}s.`
        );
        endSession();
        return;
      }
      sortSlimesByTierForReveal(result.slimes, speciesList);
      await insertSleepSession(result.session);
      addCandies(result.candies);
      for (const slime of result.slimes) {
        await insertSlime(slime);
        addSlime(slime);
      }
      setSummaryRewards(result.candies, result.slimes, result.session.durationHours);
      void refreshSleepStreakFromDb();
    } catch (e) {
      console.warn('Sleep reward error:', e);
      Alert.alert('Error', 'Could not save sleep session.');
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleSeeSlimes = () => startReveal();
  const handleGoToCollection = () => {
    finishReveal();
    router.replace('/(tabs)/collection');
  };

  const handleStartSleepFromModal = () => {
    startSession(alarmDate ? alarmDate.getTime() : null);
    setSleepModalVisible(false);
  };

  const currentRevealSlime = slimesToReveal[revealIndex];
  const revealSpecies = currentRevealSlime
    ? speciesList.find((s) => s.id === currentRevealSlime.speciesId)
    : null;
  const isLastReveal = revealIndex >= slimesToReveal.length - 1;
  const revealTotal = slimesToReveal.length;
  const revealProgress = revealTotal > 0 ? `${revealIndex + 1}/${revealTotal}` : '0/0';

  const bottomPad = Math.max(insets.bottom, 12) + 8;

  const meadowZone =
    zones.find((z) => z.id === ZONES.GRASSY_MEADOW.id) ?? zones[0];
  const meadowSelected =
    meadowZone != null && selectedZoneId === meadowZone.id && meadowZone.unlockedByDefault;

  if (phase === 'idle') {
    /** Compact preview: bounded by width and screen height; `contain` avoids cropping. */
    const zoneInnerWidth = windowWidth - 40;
    const zoneImageHeight = Math.max(
      100,
      Math.min(Math.round(zoneInnerWidth * 1), Math.round(windowHeight * 0.5))
    );

    return (
      <>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.idleScrollContent,
            { flexGrow: 1, paddingBottom: bottomPad },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {zoneSelectOpen ? (
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
                {(zones.length > 0 ? zones : [ZONES.GRASSY_MEADOW]).map((zone) => {
                  const unlocked = zone.unlockedByDefault;
                  const selected = unlocked && selectedZoneId === zone.id;
                  return (
                    <Pressable
                      key={zone.id}
                      onPress={() => {
                        if (!unlocked) return;
                        setSelectedZone(zone.id);
                        setZoneSelectOpen(false);
                      }}
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
          ) : (
            <>
              <View style={styles.idleTopRow}>
                <Pressable
                  style={styles.sleepDataPill}
                  onPress={() => router.push('/sleep-data')}
                  accessibilityRole="button"
                  accessibilityLabel="Sleep data"
                >
                  <SleepDataPillLabel />
                </Pressable>
                <Pressable
                  style={styles.menuCircle}
                  onPress={() => {
                    const buttons: {
                      text: string;
                      onPress?: () => void;
                      style?: 'cancel';
                    }[] = [
                      {
                        text: 'Slimepedia',
                        onPress: () => router.push('/encyclopedia'),
                      },
                    ];
                    if (__DEV__) {
                      buttons.push({
                        text: 'Dev',
                        onPress: () => router.push('/dev'),
                      });
                    }
                    buttons.push({ text: 'Cancel', style: 'cancel' });
                    Alert.alert('More', undefined, buttons);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Menu"
                >
                  <View style={styles.menuBars}>
                    <View style={styles.menuBar} />
                    <View style={[styles.menuBar]} />
                    <View style={styles.menuBar} />
                  </View>
                </Pressable>
              </View>

              {meadowZone != null ? (
                <View style={styles.idleZoneBlock}>
                  <Text style={styles.zoneSectionLabel}>Sleep zone</Text>
                  <Pressable
                    onPress={() => meadowZone.unlockedByDefault && setZoneSelectOpen(true)}
                    disabled={!meadowZone.unlockedByDefault}
                    style={[
                      styles.zoneImageCard,
                      { height: zoneImageHeight },
                      !meadowZone.unlockedByDefault && styles.zoneImageCardLocked,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: meadowSelected }}
                    accessibilityLabel={`${meadowZone.name}. ${meadowZone.effect}`}
                  >
                    <Image
                      source={GRASSY_MEADOW_WORLD}
                      style={styles.zoneImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                  <Text style={styles.zoneCaption} numberOfLines={1}>
                    {meadowZone.name}
                  </Text>
                  <Text style={styles.zoneEffectLine} numberOfLines={2}>
                    {meadowZone.unlockedByDefault ? meadowZone.effect : 'Locked'}
                  </Text>
                </View>
              ) : null}

              <View style={styles.idleFooter}>
                <Pressable
                  style={styles.heroSleep}
                  onPress={() => setSleepModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Start sleep"
                >
                  <SleepCtaLabel />
                </Pressable>

                {__DEV__ && (
                  <Link href="/dev" asChild style={styles.devLink}>
                    <Pressable>
                      <Text style={styles.devLinkText}>Dev — View SQLite</Text>
                    </Pressable>
                  </Link>
                )}
              </View>
            </>
          )}
        </ScrollView>

        <SleepModal
          visible={sleepModalVisible}
          alarmDate={alarmDate}
          onAlarmDateChange={setAlarmDate}
          onClose={() => setSleepModalVisible(false)}
          onConfirm={handleStartSleepFromModal}
        />
      </>
    );
  }

  if (phase === 'tracking') {
    return (
      <SleepingTrackingPhase
        currentTime={currentTime}
        trackingDots={trackingDots}
        alarmAt={alarmAt}
        loading={loading}
        bottomPad={bottomPad}
        onStop={handleStopSleep}
      />
    );
  }

  if (phase === 'summary') {
    return (
      <SleepSummaryPhase
        durationHours={summaryDurationHours}
        candies={summaryCandies}
        slimeCount={summarySlimes.length}
        onSeeSlimes={handleSeeSlimes}
      />
    );
  }

  if (phase === 'reveal' && currentRevealSlime && revealSpecies) {
    return (
      <SleepRevealPhase
        candies={summaryCandies}
        revealProgress={revealProgress}
        speciesName={revealSpecies.name}
        tierLabel={TIER_LABELS[revealSpecies.tier].toLowerCase()}
        slimeImage={getSlimeImageSource(revealSpecies.id)}
        ctaLabel={isLastReveal ? 'Go to collection' : 'Continue'}
        onPressCta={isLastReveal ? handleGoToCollection : nextReveal}
      />
    );
  }

  return null;
}

const styles = createAppStyles({
  screen: {
    flex: 1,
    backgroundColor: uiOne.sleepIdle.screenBg,
  },
  /** flexGrow: 1 (inline) fills the viewport so flex children size like a non-scrolling screen; scroll only if content overflows. */
  idleScrollContent: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  idleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexShrink: 0,
  },
  idleZoneBlock: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'flex-start',
  },
  idleFooter: {
    flexShrink: 0,
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
  zoneSelectContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 100,
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
    color: uiOne.sleepIdle.roseBorderStrong,
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
    backgroundColor: uiOne.sleepIdle.screenBg,
    borderRadius: 12,
    marginBottom: 8,
  },
  zoneSelectCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: uiOne.sleepIdle.roseBorderStrong,
    marginBottom: 2,
    textAlign: 'center',
  },
  zoneSelectCardEffect: {
    fontSize: 12,
    color: uiOne.sleepIdle.roseBorder,
    lineHeight: 16,
    textAlign: 'center',
  },
  sleepDataPill: {
    minHeight: 50,
    minWidth: 120,
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginLeft: -10,
    borderRadius: 12,
    backgroundColor: uiOne.sleepIdle.pillFill,
    borderWidth: 4,
    borderColor: uiOne.sleepIdle.roseBorder,
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
    borderColor: uiOne.sleepIdle.roseBorder,
    backgroundColor: uiOne.sleepIdle.pillFill,
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
    backgroundColor: uiOne.sleepIdle.menuIcon,
  },
  menuBarMid: {
    width: 14,
  },
  zoneSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: uiOne.sleepIdle.roseBorderStrong,
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
    backgroundColor: uiOne.sleepIdle.screenBg,
  },
  zoneCaption: {
    fontSize: 18,
    fontWeight: '800',
    color: uiOne.sleepIdle.roseBorderStrong,
    marginBottom: 4,
    flexShrink: 0,
  },
  zoneEffectLine: {
    fontSize: 13,
    color: uiOne.sleepIdle.roseBorder,
    marginBottom: 0,
    lineHeight: 18,
    flexShrink: 0,
  },
  heroSleep: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: uiOne.sleepIdle.pillFill,
    borderRadius: uiOne.radiusLg,
    borderWidth: 6,
    borderColor: uiOne.sleepIdle.roseBorder,
  },
  sleepCtaSvgWrap: {
    minWidth: 168,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devLink: { marginTop: 8, alignSelf: 'center' },
  devLinkText: { fontSize: 12, color: uiOne.textSubtle },

  centeredPhase: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryCta: {
    backgroundColor: uiOne.primary,
    paddingVertical: 20,
    borderRadius: uiOne.radiusMd,
    alignItems: 'center',
  },
  primaryCtaText: {
    color: uiOne.primaryContrast,
    fontSize: 17,
    fontWeight: '700',
  },

});
