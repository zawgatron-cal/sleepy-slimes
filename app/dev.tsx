/**
 * Dev-only page: view SQLite data (sleep_sessions, slimes, species).
 * Only reachable in __DEV__. Use for verifying saved sleep data and collection.
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { getCandiesState, getSleepSessions, getSlimes, getSpecies } from '@/src/db';
import { getMinValidSleepSeconds } from '../src/constants/sleep';
import type { SleepSession, Slime, Species } from '@/src/types';

export default function DevPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [slimes, setSlimes] = useState<Slime[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [candiesState, setCandiesState] = useState<{ total: number; lastUpdatedAt: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [sess, slim, spec, candies] = await Promise.all([
        getSleepSessions(),
        getSlimes(),
        getSpecies(),
        getCandiesState(),
      ]);
      setSessions(sess);
      setSlimes(slim);
      setSpecies(spec);
      setCandiesState(candies);
    } catch (e) {
      console.warn('Dev load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatTs = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Dev — SQLite data</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={load} style={styles.refreshBtn} disabled={loading}>
            <Text style={styles.refreshText}>{loading ? 'Loading...' : 'Refresh'}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        candies_state {candiesState ? '' : '(empty)'}
      </Text>
      {candiesState ? (
        <View style={styles.row}>
          <Text style={styles.mono}>
            total: {candiesState.total} | last_updated_at:{' '}
            {new Date(candiesState.lastUpdatedAt).toISOString()}
          </Text>
        </View>
      ) : (
        <Text style={styles.empty}>No candies_state row yet.</Text>
      )}

      <Text style={styles.sectionTitle}>sleep_sessions ({sessions.length})</Text>
      {sessions.length === 0 ? (
        <Text style={styles.empty}>No sessions yet. Complete a {getMinValidSleepSeconds()}+ second sleep.</Text>
      ) : (
        sessions.map((s) => (
          <View key={s.id} style={styles.row}>
            <Text style={styles.mono}>{s.id}</Text>
            <Text style={styles.mono}>zone: {s.zoneId} | started: {formatTs(s.startedAt)}</Text>
            <Text style={styles.mono}>ended: {s.endedAt != null ? formatTs(s.endedAt) : 'null'} | duration_h: {s.durationHours.toFixed(4)} | candies: {s.candiesEarned}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>slimes ({slimes.length})</Text>
      {slimes.length === 0 ? (
        <Text style={styles.empty}>No slimes. Earn from sleep.</Text>
      ) : (
        slimes.map((s) => (
          <View key={s.id} style={styles.row}>
            <Text style={styles.mono}>{s.id} | species_id: {s.speciesId} | acquired: {formatTs(s.acquiredAt)} | source: {s.source ?? 'null'}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>species ({species.length})</Text>
      {species.map((s) => (
        <View key={s.id} style={styles.row}>
          <Text style={styles.mono}>{s.id} | {s.name} | set: {s.setId} | tier: {s.tier}</Text>
        </View>
      ))}

      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  candies: { color: '#fff', fontSize: 16, fontWeight: '800' },
  refreshBtn: { padding: 8, backgroundColor: '#333', borderRadius: 6 },
  refreshText: { color: '#fff', fontSize: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#aaa', marginTop: 16, marginBottom: 6 },
  row: { backgroundColor: '#2a2a2a', padding: 10, borderRadius: 6, marginBottom: 6 },
  mono: { fontFamily: 'monospace', fontSize: 11, color: '#ccc', marginBottom: 2 },
  empty: { fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 8 },
  backBtn: { marginTop: 24, padding: 14, backgroundColor: '#333', borderRadius: 8, alignItems: 'center' },
  backText: { color: '#fff', fontSize: 16 },
});
