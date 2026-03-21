/**
 * Sleep screen — full flow: Initiate → Tracking → Summary → Slime reveal.
 * Valid session = 30+ seconds; then persist session + rewards to DB and stores.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { cancelAlarm, stopAlarmLoop } from '../../src/services/alarmNotifications';
import { useSleepStore, useCandiesStore, useCollectionStore } from '@/src/stores';
import { useSleepDataLoader, useTrackingPhaseUI, useSleepAlarm } from '@/src/hooks';
import { insertSleepSession, insertSlime } from '@/src/db';
import { computeSleepRewards } from '@/src/services/sleepRewards';
import { MIN_VALID_SLEEP_SECONDS, TIER_LABELS } from '@/src/constants/game';
import { formatTime, sortSlimesByTierForReveal } from '@/src/utils/sleepScreen';
import { SleepModal } from '@/src/components';

export default function SleepScreen() {
  const router = useRouter();
  const {
    phase,
    selectedZoneId,
    sessionStartedAt,
    alarmAt,
    summaryCandies,
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

  // hooks for loading data and tracking time
  const { speciesList, zones } = useSleepDataLoader();
  const { currentTime, trackingDots } = useTrackingPhaseUI(phase);
  useSleepAlarm(phase, alarmAt, currentTime);

  // state for UI
  const [loading, setLoading] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [alarmDate, setAlarmDate] = useState<Date | null>(null);

  // Handle stopping sleep
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
      setSummaryRewards(result.candies, result.slimes);
    } catch (e) {
      console.warn('Sleep reward error:', e);
      Alert.alert('Error', 'Could not save sleep session.');
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleSeeSlimes = () => startReveal();
  const handleNextReveal = () => {
    if (revealIndex >= slimesToReveal.length - 1) {
      finishReveal();
      router.replace('/(tabs)/collection');
    } else {
      nextReveal();
    }
  };
  const handleGoToCollection = () => {
    finishReveal();
    router.replace('/(tabs)/collection');
  };

  const handleStartSleepFromModal = () => {
    setSleepModalVisible(false);
    startSession(alarmDate ? alarmDate.getTime() : null);
  };

  const currentRevealSlime = slimesToReveal[revealIndex];
  const revealSpecies = currentRevealSlime
    ? speciesList.find((s) => s.id === currentRevealSlime.speciesId)
    : null;
  const isLastReveal = revealIndex >= slimesToReveal.length - 1;

  // ——— Phase: idle ——— Sleep Data (placeholder), zone selection, big Sleep button → modal
  if (phase === 'idle') {
    return (
      <>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Sleep Data button — not implemented */}
          <Pressable
            style={styles.sleepDataButton}
            onPress={() => router.push('/sleep-data')}
          >
            <Text style={styles.sleepDataButtonText}>Sleep Data</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Sleep zone</Text>
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
                <Text style={styles.zoneEffect} numberOfLines={1}>
                  {zone.unlockedByDefault ? zone.effect : 'Locked'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Big Sleep button — opens modal */}
          <Pressable
            style={styles.bigSleepButton}
            onPress={() => setSleepModalVisible(true)}
          >
            <Text style={styles.bigSleepButtonText}>Sleep</Text>
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

  // ——— Phase: tracking ——— Active sleep (Flow 2)
  if (phase === 'tracking') {
    return (
      <View style={styles.container}>
        <View style={styles.trackingCenter}>
          <Text style={styles.clock}>{formatTime(currentTime)}</Text>
          <Text style={styles.trackingLabel}>{`Tracking Sleep${trackingDots}`}</Text>
          <Text style={styles.alarm}>
            {alarmAt && alarmAt > Date.now()
              ? `Alarm ${formatTime(alarmAt)}`
              : 'No alarm'}
          </Text>
        </View>
        <Pressable
          style={styles.stopButton}
          onPress={handleStopSleep}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Saving...' : 'Stop sleeping'}
          </Text>
        </Pressable>
      </View>
    );
  }

  // ——— Phase: summary ——— You got X ☆, N slimes (Flow 3)
  if (phase === 'summary') {
    return (
      <View style={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.sleepDataTitle}>Sleep Data</Text>
          <Text style={styles.youGot}>You Got:</Text>
          <Text style={styles.rewards}>
            {summaryCandies} 🍬{'\n'}
            {summarySlimes.length} slime{summarySlimes.length !== 1 ? 's' : ''} came!
          </Text>
          <Pressable style={styles.seeSlimesButton} onPress={handleSeeSlimes}>
            <Text style={styles.primaryButtonText}>See Slimes!</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ——— Phase: reveal ——— One slime at a time (Flow 4 & 5)
  if (phase === 'reveal' && currentRevealSlime && revealSpecies) {
    return (
      <View style={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.sleepDataTitle}>Sleep Data</Text>
          <View style={styles.slimeReveal}>
            <View style={styles.slimeIconPlaceholder}>
              <Text style={styles.slimeEmoji}>🟢</Text>
            </View>
            <Text style={styles.slimeName}>
              {revealSpecies.name} {TIER_LABELS[revealSpecies.tier].toLowerCase()}
            </Text>
            {isLastReveal ? (
              <Pressable style={styles.primaryButton} onPress={handleGoToCollection}>
                <Text style={styles.primaryButtonText}>Go to Collection</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.primaryButton} onPress={handleNextReveal}>
                <Text style={styles.primaryButtonText}>Next</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  zoneList: { gap: 8, marginBottom: 24 },
  zoneCard: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  zoneCardSelected: { borderColor: '#333', backgroundColor: '#eee' },
  zoneCardLocked: { opacity: 0.6 },
  zoneName: { fontSize: 16, fontWeight: '600' },
  zoneEffect: { fontSize: 12, color: '#666', marginTop: 2 },
  lockedText: { color: '#999' },
  sleepDataButton: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sleepDataButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  sleepDataButtonHint: { fontSize: 12, color: '#999', marginTop: 4 },
  bigSleepButton: {
    marginTop: 24,
    paddingVertical: 24,
    paddingHorizontal: 48,
    backgroundColor: '#333',
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'center',
  },
  bigSleepButtonText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  sleepDataTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  primaryButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  trackingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  clock: { fontSize: 32, fontWeight: '700' },
  trackingLabel: { fontSize: 18, color: '#666' },
  alarm: { fontSize: 14, color: '#999' },
  stopButton: {
    backgroundColor: '#c00',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryCard: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  youGot: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  rewards: { fontSize: 16, color: '#333', marginBottom: 16 },
  seeSlimesButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  slimeReveal: { alignItems: 'center' },
  slimeIconPlaceholder: { width: 80, height: 80, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  slimeEmoji: { fontSize: 48 },
  slimeName: { fontSize: 18, fontWeight: '600' },
  devLink: { marginTop: 16 },
  devLinkText: { fontSize: 12, color: '#999' },
});
