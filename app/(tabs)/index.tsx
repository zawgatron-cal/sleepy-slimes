/**
 * Sleep screen — PRD Evening (~5 min): pick zone, optionally fuse, start sleep.
 * Morning (~5 min): log duration, slimes spawn, candies awarded, streak update.
 * Baseline: zone selector, start/stop sleep button, placeholder for duration/quality and alarm.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSleepStore, useCandiesStore } from '@/src/stores';
import { ZONES } from '@/src/constants/zones';

export default function SleepScreen() {
  const {
    phase,
    selectedZoneId,
    durationHours,
    quality,
    currentStreak,
    setSelectedZone,
    startSession,
    endSession,
  } = useSleepStore();
  const candies = useCandiesStore((s) => s.total);

  const isSleeping = phase === 'sleeping';

  return (
    <View style={styles.container}>
      {/* Candies and streak — minimal header info */}
      <View style={styles.summary}>
        <Text style={styles.candies}>🍬 {candies}</Text>
        <Text style={styles.streak}>Streak: {currentStreak} days</Text>
      </View>

      {/* Sleep zone selection */}
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

      {/* Start / Stop sleep */}
      <View style={styles.actions}>
        {!isSleeping ? (
          <Pressable style={styles.primaryButton} onPress={startSession}>
            <Text style={styles.primaryButtonText}>Start sleep</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.stopButton} onPress={endSession}>
            <Text style={styles.primaryButtonText}>Stop sleep</Text>
          </Pressable>
        )}
      </View>

      {/* Placeholder: duration & quality (morning log) — will be wired to real input later */}
      <View style={styles.placeholders}>
        <Text style={styles.placeholderLabel}>Duration (hours): {durationHours || '—'}</Text>
        <Text style={styles.placeholderLabel}>Quality: {quality || '—'}</Text>
        <Text style={styles.hint}>Manual input and alarm will be added later.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  candies: { fontSize: 18, fontWeight: '600' },
  streak: { fontSize: 14, color: '#666' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
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
  actions: { marginBottom: 24 },
  primaryButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#c00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  placeholders: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  placeholderLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  hint: { fontSize: 12, color: '#999', marginTop: 8 },
});
