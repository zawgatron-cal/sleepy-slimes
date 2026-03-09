/**
 * Sleep screen — full flow: Initiate → Tracking → Summary → Slime reveal.
 * Valid session = 30+ seconds; then persist session + rewards to DB and stores.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSleepStore, useCandiesStore, useCollectionStore } from '@/src/stores';
import { ZONES } from '@/src/constants/zones';
import { insertSleepSession, insertSlime, getSpecies } from '@/src/db';
import { computeSleepRewards } from '@/src/services/sleepRewards';
import { TIER_LABELS } from '@/src/types';
import type { Species } from '@/src/types';

function formatTime(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

export default function SleepScreen() {
  const router = useRouter();
  const {
    phase,
    selectedZoneId,
    sessionStartedAt,
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
  const candiesTotal = useCandiesStore((s) => s.total);

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSpecies().then(setSpeciesList);
  }, []);

  useEffect(() => {
    if (phase !== 'tracking') return;
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const handleStopSleep = async () => {
    if (!sessionStartedAt) return;
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
          `Sleep at least 30 seconds. You slept ${Math.floor(result.durationSeconds)}s.`
        );
        endSession();
        return;
      }
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

  const currentRevealSlime = slimesToReveal[revealIndex];
  const revealSpecies = currentRevealSlime
    ? speciesList.find((s) => s.id === currentRevealSlime.speciesId)
    : null;
  const isLastReveal = revealIndex >= slimesToReveal.length - 1;

  // ——— Phase: idle ——— Initiate sleep (Flow 1)
  if (phase === 'idle') {
    const bedtimeDisplay = formatTime(Date.now());
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.candies}>🍬 {candiesTotal}</Text>
        </View>
        <Text style={styles.sectionTitle}>Sleep zone</Text>
        <View style={styles.zoneList}>
          {ZONES.map((zone) => (
            <Pressable
              key={zone.id}
              onPress={() => zone.unlocked && setSelectedZone(zone.id)}
              style={[
                styles.zoneCard,
                selectedZoneId === zone.id && styles.zoneCardSelected,
                !zone.unlocked && styles.zoneCardLocked,
              ]}
            >
              <Text style={[styles.zoneName, !zone.unlocked && styles.lockedText]}>
                {zone.name}
              </Text>
              <Text style={styles.zoneEffect} numberOfLines={1}>
                {zone.unlocked ? zone.effect : 'Locked'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.sleepData}>
          <Text style={styles.sleepDataTitle}>Sleep Data</Text>
          <Text style={styles.bedtime}>Bedtime {bedtimeDisplay}</Text>
          <View style={styles.rowButtons}>
            <Pressable style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.sleepButton} onPress={startSession}>
              <Text style={styles.primaryButtonText}>Sleep</Text>
            </Pressable>
          </View>
          {__DEV__ && (
            <Link href="/dev" asChild style={styles.devLink}>
              <Pressable>
                <Text style={styles.devLinkText}>Dev — View SQLite</Text>
              </Pressable>
            </Link>
          )}
        </View>
      </ScrollView>
    );
  }

  // ——— Phase: tracking ——— Active sleep (Flow 2)
  if (phase === 'tracking') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.candies}>🍬 {candiesTotal}</Text>
        </View>
        <View style={styles.trackingCenter}>
          <Text style={styles.clock}>{formatTime(currentTime)}</Text>
          <Text style={styles.trackingLabel}>Tracking Sleep...</Text>
          <Text style={styles.alarm}>Alarm 9:00 AM</Text>
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
            {summaryCandies} ☆{'\n'}
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
  candies: { fontSize: 18, fontWeight: '600' },
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
  sleepData: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  sleepDataTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  bedtime: { fontSize: 15, color: '#333', marginBottom: 16 },
  rowButtons: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelButtonText: { fontSize: 16, color: '#666' },
  sleepButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
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
