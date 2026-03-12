/**
 * Sleep screen — full flow: Initiate → Tracking → Summary → Slime reveal.
 * Valid session = 30+ seconds; then persist session + rewards to DB and stores.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, Modal, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  requestPermissions,
  scheduleAlarm,
  cancelAlarm,
  preloadAlarmSound,
  startAlarmLoop,
  stopAlarmLoop,
} from '../../src/services/alarmNotifications';
import { useSleepStore, useCandiesStore, useCollectionStore } from '@/src/stores';
import { getZones, insertSleepSession, insertSlime, getSpecies } from '@/src/db';
import { getMinValidSleepSeconds } from '../../src/constants/sleep';
import { computeSleepRewards } from '@/src/services/sleepRewards';
import { TIER_LABELS } from '@/src/constants/game';
import type { Species, Zone } from '@/src/types';

function formatTime(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

function computeNextAlarmDateFromTime(time: Date, now: Date = new Date()): Date {
  const hours = time.getHours();
  const minutes = time.getMinutes();

  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);

  const inDayWindow = hours >= 9 && hours < 22; // after 9:00 AM and before 10:00 PM

  if (inDayWindow) {
    if (candidate > now) return candidate;
    candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }

  // Any time before 9:00 AM or at/after 10:00 PM is always "tomorrow"
  candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

function getDefaultAlarmDate(): Date {
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  return computeNextAlarmDateFromTime(base);
}

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

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [alarmDate, setAlarmDate] = useState<Date | null>(null);
  const [alarmLoopStarted, setAlarmLoopStarted] = useState(false);
  const [trackingDots, setTrackingDots] = useState('');

  useEffect(() => {
    getSpecies().then(setSpeciesList);
    getZones().then(setZones);
  }, []);

  useEffect(() => {
    if (phase !== 'tracking') return;
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Animate "Tracking Sleep..." with looping dots while tracking.
  useEffect(() => {
    if (phase !== 'tracking') {
      setTrackingDots('');
      return;
    }
    const frames = ['', '.', '..', '...'];
    let i = 0;
    setTrackingDots(frames[i]);
    const t = setInterval(() => {
      i = (i + 1) % frames.length;
      setTrackingDots(frames[i]);
    }, 800);
    return () => clearInterval(t);
  }, [phase]);

  // Preload alarm audio to avoid a big delay at alarm time
  useEffect(() => {
    if (phase !== 'tracking' || !alarmAt || alarmAt <= Date.now()) return;
    let cancelled = false;
    preloadAlarmSound().catch((e) => {
      if (!cancelled) console.warn('preloadAlarmSound failed', e);
    });
    return () => {
      cancelled = true;
    };
  }, [phase, alarmAt]);

  // Schedule alarm notification when entering tracking with alarm set
  useEffect(() => {
    if (phase !== 'tracking' || !alarmAt || alarmAt <= Date.now()) return;
    let cancelled = false;
    (async () => {
      const ok = await requestPermissions();
      if (!ok || cancelled) return;
      await scheduleAlarm(alarmAt);
    })();
    return () => { cancelled = true; };
  }, [phase, alarmAt]);

  // Start/stop in-app alarm loop based on phase and whether we've passed alarm time
  useEffect(() => {
    // Use `currentTime` (1s tick) so this triggers promptly when time passes.
    if (phase === 'tracking' && alarmAt && alarmAt <= currentTime && !alarmLoopStarted) {
      setAlarmLoopStarted(true);
      startAlarmLoop().catch((e) => console.warn('startAlarmLoop failed', e));
    }
    if (phase !== 'tracking' && alarmLoopStarted) {
      stopAlarmLoop();
      setAlarmLoopStarted(false);
    }
  }, [phase, alarmAt, alarmLoopStarted, currentTime]);

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
          `Sleep at least ${getMinValidSleepSeconds()} seconds. You slept ${Math.floor(result.durationSeconds)}s.`
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

type SleepModalProps = {
  visible: boolean;
  alarmDate: Date | null;
  onAlarmDateChange: (date: Date | null) => void;
  onClose: () => void;
  onConfirm: () => void;
};

function SleepModal({
  visible,
  alarmDate,
  onAlarmDateChange,
  onClose,
  onConfirm,
}: SleepModalProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (date) {
      const next = computeNextAlarmDateFromTime(date);
      onAlarmDateChange(next);
    }
    if (Platform.OS === 'android') setShowPicker(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sleepDataTitle}>All ready to sleep?</Text>
          <Text style={styles.bedtime}>Bedtime {formatTime(Date.now())}</Text>

          <View style={styles.alarmRow}>
            <Text style={styles.alarmLabel}>Alarm</Text>
            <View style={styles.alarmActions}>
              <Pressable
                style={[styles.alarmOption, !alarmDate && styles.alarmOptionActive]}
                onPress={() => {
                  onAlarmDateChange(null);
                  setShowPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.alarmOptionText,
                    !alarmDate && styles.alarmOptionTextActive,
                  ]}
                >
                  No alarm
                </Text>
              </Pressable>
              <Pressable
                style={[styles.alarmOption, alarmDate && styles.alarmOptionActive]}
                onPress={() => {
                  if (!alarmDate) onAlarmDateChange(getDefaultAlarmDate());
                  setShowPicker(true);
                }}
              >
                <Text
                  style={[
                    styles.alarmOptionText,
                    alarmDate && styles.alarmOptionTextActive,
                  ]}
                >
                  {alarmDate ? formatTime(alarmDate.getTime()) : 'Set'}
                </Text>
              </Pressable>
            </View>
          </View>

          {showPicker && (
            <DateTimePicker
              value={alarmDate ?? new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
              themeVariant="light"
              textColor={Platform.OS === 'ios' ? '#000000' : undefined}
              accentColor={Platform.OS === 'ios' ? '#000000' : undefined}
              style={Platform.OS === 'ios' ? { backgroundColor: '#fff' } : undefined}
            />
          )}

          <View style={styles.rowButtons}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.sleepButton} onPress={onConfirm}>
              <Text style={styles.primaryButtonText}>Sleep</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  sleepDataTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  bedtime: { fontSize: 15, color: '#333', marginBottom: 12 },
  alarmRow: { marginBottom: 16 },
  alarmLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  alarmActions: { flexDirection: 'row', gap: 8 },
  alarmOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  alarmOptionActive: { backgroundColor: '#333', borderColor: '#333' },
  alarmOptionText: { fontSize: 14, color: '#333' },
  alarmOptionTextActive: { color: '#ffffff' },
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
