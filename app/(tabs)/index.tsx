/**
 * Sleep screen — ui-one.pdf flow: idle → modal → tracking → summary → reveal(s).
 */

import { useCallback, useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { View, Text, Pressable, Alert, useWindowDimensions } from 'react-native';
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
  SleepCtaLabel,
  SleepZoneSelectPanel,
  SleepIdleTopRow,
  SleepZonePreview,
} from '@/src/components';
import { SLEEP_TRACKING_LOGO, SLEEP_TRACKING_TILE } from '@/src/constants/sleepTrackingAssets';
import { SUMMARY_BACKGROUND_TILE } from '@/src/constants/summaryScreenAssets';
import { ZONES } from '@/src/data';
import { GRASSY_MEADOW_WORLD } from '@/src/constants/sleepIdleAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

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
  if (phase === 'idle') {
    /** Compact preview: bounded by width and screen height; `contain` avoids cropping. */
    const zoneInnerWidth = windowWidth - 40;
    const zoneImageHeight = Math.max(
      100,
      Math.min(Math.round(zoneInnerWidth * 1), Math.round(windowHeight * 0.5))
    );

    return (
      <>
        <View style={styles.screen}>
          <View
            style={[styles.idleContent, { paddingBottom: bottomPad }]}
          >
          {zoneSelectOpen ? (
            <SleepZoneSelectPanel
              zones={zones}
              selectedZoneId={selectedZoneId}
              zoneImageHeight={zoneImageHeight}
              windowWidth={windowWidth}
              onSelectZone={(zoneId) => {
                setSelectedZone(zoneId);
                setZoneSelectOpen(false);
              }}
            />
          ) : (
            <>
              <SleepIdleTopRow
                onPressSleepData={() => router.push('/sleep-data')}
                onPressMenu={() => {
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
              />

              {meadowZone != null ? (
                <SleepZonePreview
                  zone={meadowZone}
                  zoneImageHeight={zoneImageHeight}
                  onPress={() => meadowZone.unlockedByDefault && setZoneSelectOpen(true)}
                />
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
          </View>
        </View>

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
    backgroundColor: mainScreens.idle.bg,
  },
  idleContent: {
    flex: 1,
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
  menuBarMid: {
    width: 14,
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
  heroSleep: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: mainScreens.idle.surface,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: mainScreens.idle.borderOne,
  },
  sleepCtaSvgWrap: {
    minWidth: 168,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devLink: { marginTop: 8, alignSelf: 'center' },
  devLinkText: { fontSize: 12, color: mainScreens.idle.mutedText },

  centeredPhase: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryCta: {
    backgroundColor: mainScreens.idle.primary,
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryCtaText: {
    color: mainScreens.shared.onPrimary,
    fontSize: 17,
    fontWeight: '700',
  },

});
