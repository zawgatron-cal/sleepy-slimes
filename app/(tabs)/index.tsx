/**
 * Sleep screen — ui-one.pdf flow: idle → modal → tracking → summary → reveal(s).
 */

import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { View, Text, Pressable, Alert, ScrollView, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cancelAlarm, stopAlarmLoop } from '../../src/services/alarmNotifications';
import { useSleepStore, useCandiesStore, useCollectionStore } from '@/src/stores';
import { useSleepDataLoader, useTrackingPhaseUI, useSleepAlarm } from '@/src/hooks';
import { insertSleepSession, insertSlime } from '@/src/db';
import { computeSleepRewards } from '@/src/services/sleepRewards';
import { MIN_VALID_SLEEP_SECONDS, TIER_LABELS } from '@/src/constants/game';
import { sortSlimesByTierForReveal } from '@/src/utils/sleepScreen';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { SleepModal, SleepingTrackingPhase, SleepSummaryPhase } from '@/src/components';
import { SLEEP_TRACKING_LOGO, SLEEP_TRACKING_TILE } from '@/src/constants/sleepTrackingAssets';
import { SUMMARY_BACKGROUND_TILE } from '@/src/constants/summaryScreenAssets';
import { uiOne } from '@/src/theme/uiOne';
import { createAppStyles } from '@/src/theme/createAppStyles';

export default function SleepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const [loading, setLoading] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [alarmDate, setAlarmDate] = useState<Date | null>(null);

  useEffect(() => {
    void Asset.loadAsync([
      SLEEP_TRACKING_TILE,
      SLEEP_TRACKING_LOGO,
      SUMMARY_BACKGROUND_TILE,
    ]);
  }, []);

  useEffect(() => {
    if (!sleepModalVisible) return;
    void Asset.loadAsync([
      SLEEP_TRACKING_TILE,
      SLEEP_TRACKING_LOGO,
      SUMMARY_BACKGROUND_TILE,
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

  if (phase === 'idle') {
    return (
      <>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[styles.idleContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.secondaryPill}
            onPress={() => router.push('/sleep-data')}
          >
            <Text style={styles.secondaryPillText}>Sleep Data</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>Sleep zone</Text>
          <View style={styles.zoneList}>
            {zones.map((zone) => (
              <Pressable
                key={zone.id}
                onPress={() => zone.unlockedByDefault && setSelectedZone(zone.id)}
                style={[
                  styles.zoneCard,
                  selectedZoneId === zone.id && styles.zoneCardSelected,
                  !zone.unlockedByDefault && styles.zoneCardLocked,
                ]}
              >
                <Text style={[styles.zoneName, !zone.unlockedByDefault && styles.lockedText]}>
                  {zone.name}
                </Text>
                <Text style={styles.zoneEffect} numberOfLines={2}>
                  {zone.unlockedByDefault ? zone.effect : 'Locked'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.heroSleep}
            onPress={() => setSleepModalVisible(true)}
          >
            <Text style={styles.heroSleepText}>Sleep</Text>
          </Pressable>

          {__DEV__ && (
            <Link href="/dev" asChild style={styles.devLink}>
              <Pressable>
                <Text style={styles.devLinkText}>Dev — View SQLite</Text>
              </Pressable>
            </Link>
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
      <View style={[styles.screen, styles.centeredPhase]}>
        <View style={styles.revealCard}>
          <Text style={styles.revealCandiesLine}>
            Candies Collected: <Text style={styles.revealCandiesValue}>{summaryCandies}</Text>
          </Text>
          <Text style={styles.revealProgress}>
            You found a… <Text style={styles.revealProgressEm}>{revealProgress}</Text>
          </Text>
          <View style={styles.revealImageWrap}>
            <Image
              source={getSlimeImageSource(revealSpecies.id)}
              style={styles.revealImage}
            />
          </View>
          <Text style={styles.revealSpeciesName}>{revealSpecies.name}</Text>
          <Text style={styles.revealTier}>{TIER_LABELS[revealSpecies.tier].toLowerCase()}</Text>
          {isLastReveal ? (
            <Pressable style={styles.primaryCta} onPress={handleGoToCollection}>
              <Text style={styles.primaryCtaText}>Go to collection</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.primaryCta} onPress={nextReveal}>
              <Text style={styles.primaryCtaText}>Continue</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return null;
}

const styles = createAppStyles({
  screen: {
    flex: 1,
    backgroundColor: uiOne.bg,
  },
  idleContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  secondaryPill: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: uiOne.radiusMd,
    backgroundColor: uiOne.surface,
    borderWidth: 1,
    borderColor: uiOne.border,
    marginBottom: 20,
  },
  secondaryPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: uiOne.textMuted,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: uiOne.textSubtle,
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  zoneList: { gap: 10, marginBottom: 28 },
  zoneCard: {
    padding: 16,
    backgroundColor: uiOne.bgElevated,
    borderRadius: uiOne.radiusMd,
    borderWidth: 1,
    borderColor: uiOne.border,
    ...uiOne.shadow,
  },
  zoneCardSelected: {
    borderColor: uiOne.primary,
    borderWidth: 2,
    backgroundColor: '#FFFCF8',
  },
  zoneCardLocked: { opacity: 0.55 },
  zoneName: { fontSize: 17, fontWeight: '700', color: uiOne.text },
  zoneEffect: { fontSize: 13, color: uiOne.textMuted, marginTop: 4, lineHeight: 18 },
  lockedText: { color: uiOne.textSubtle },
  heroSleep: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 22,
    paddingHorizontal: 56,
    backgroundColor: uiOne.primary,
    borderRadius: uiOne.radiusLg,
    ...uiOne.shadow,
  },
  heroSleepText: {
    color: uiOne.primaryContrast,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  devLink: { marginTop: 24, alignSelf: 'center' },
  devLinkText: { fontSize: 12, color: uiOne.textSubtle },

  centeredPhase: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryCta: {
    backgroundColor: uiOne.primary,
    paddingVertical: 16,
    borderRadius: uiOne.radiusMd,
    alignItems: 'center',
  },
  primaryCtaText: {
    color: uiOne.primaryContrast,
    fontSize: 17,
    fontWeight: '700',
  },

  revealCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: uiOne.bgElevated,
    borderRadius: uiOne.radiusLg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: uiOne.border,
    ...uiOne.shadow,
  },
  revealCandiesLine: {
    fontSize: 15,
    color: uiOne.textMuted,
    marginBottom: 8,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  revealCandiesValue: { fontWeight: '800', color: uiOne.text },
  revealProgress: {
    fontSize: 15,
    color: uiOne.textMuted,
    marginBottom: 20,
  },
  revealProgressEm: { fontWeight: '800', color: uiOne.text },
  revealImageWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: uiOne.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: uiOne.border,
  },
  revealImage: { width: 72, height: 72 },
  revealSpeciesName: {
    fontSize: 22,
    fontWeight: '800',
    color: uiOne.text,
    marginBottom: 4,
  },
  revealTier: {
    fontSize: 15,
    color: uiOne.textMuted,
    marginBottom: 24,
    textTransform: 'lowercase',
  },
});
