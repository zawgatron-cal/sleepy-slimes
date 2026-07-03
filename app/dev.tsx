/**
 * Dev-only page: view SQLite data (sleep_sessions, slimes, species, fusion_rules, zones, zone_spawn_weights).
 * Only reachable in __DEV__. Uses DB APIs only to test runtime paths.
 */

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getCandiesState,
  getSleepSessions,
  getSlimes,
  getSpecies,
  getFusionRules,
  getZones,
  getSpawnTableEntries,
  clearSlimes,
  clearCandies,
  rebuildSpeciesSlimesAndFusion,
} from '@/src/db';
import type { SleepSession, Slime, Species, Zone, FusionRule, SpawnTableEntry } from '@/src/types';
import { MIN_VALID_SLEEP_SECONDS, SLIME_VARIANT_LABELS, TIER_LABELS } from '@/src/constants/game';
import { DevSlimeConsole } from '@/src/components/dev/DevSlimeConsole';
import { DevSettingsPanel } from '@/src/components/dev/DevSettingsPanel';
import { RevealAnimationTestPanel } from '@/src/components/dev/RevealAnimationTestPanel';
import { VariantRevealTestPanel } from '@/src/components/dev/VariantRevealTestPanel';
import { FusionAnimationTestPanel } from '@/src/components/dev/FusionAnimationTestPanel';
import { SleepRewardSimulator } from '@/src/components/dev/SleepRewardSimulator';
import { VariantDropOddsPanel } from '@/src/components/dev/VariantDropOddsPanel';
import {
  getSlimeLevelUpStatus,
  raiseSlimeLevel,
} from '@/src/services/slimeProgression';
import { describeEquippedSlimeBonus } from '@/src/utils/equippedSlimeRewards';
import {
  hydrateEquippedSlimeFromDb,
  useCandiesStore,
  useCollectionStore,
  useEquippedSlimeStore,
} from '@/src/stores';
import { createAppStyles } from '@/src/theme/createAppStyles';

export default function DevPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [slimes, setSlimes] = useState<Slime[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [candiesState, setCandiesState] = useState<{ total: number; lastUpdatedAt: number } | null>(
    null
  );
  const [fusionRules, setFusionRules] = useState<FusionRule[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneSpawnTables, setZoneSpawnTables] = useState<Record<string, SpawnTableEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const equippedSlimeId = useEquippedSlimeStore((s) => s.equippedSlimeId);
  const setEquippedSlimeId = useEquippedSlimeStore((s) => s.setEquippedSlimeId);
  const candyTotal = useCandiesStore((s) => s.total);

  const load = async () => {
    setLoading(true);
    try {
      const [sess, slim, spec, candies, rules, zoneList] = await Promise.all([
        getSleepSessions(),
        getSlimes(),
        getSpecies(),
        getCandiesState(),
        getFusionRules(),
        getZones(),
      ]);
      setSessions(sess);
      setSlimes(slim);
      useCollectionStore.getState().setSlimes(slim);
      setSpecies(spec);
      setCandiesState(candies);
      if (candies) useCandiesStore.getState().hydrate(candies);
      await hydrateEquippedSlimeFromDb();
      setFusionRules(rules);
      setZones(zoneList);
      const spawnTables: Record<string, SpawnTableEntry[]> = {};
      await Promise.all(
        zoneList.map(async (z) => {
          const rows = await getSpawnTableEntries(z.id);
          spawnTables[z.id] = rows;
        })
      );
      setZoneSpawnTables(spawnTables as Record<string, SpawnTableEntry[]>);
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Dev — SQLite data</Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={async () => {
              try {
                await clearSlimes();
                await clearCandies();
                await load();
              } catch (e) {
                console.warn('Clear data error:', e);
              }
            }}
            style={styles.refreshBtn}
            disabled={loading}
          >
            <Text style={styles.refreshText}>Clear slimes & candies</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              try {
                await rebuildSpeciesSlimesAndFusion();
                await load();
              } catch (e) {
                console.warn('Rebuild species/slimes/fusion error:', e);
              }
            }}
            style={styles.refreshBtn}
            disabled={loading}
          >
            <Text style={styles.refreshText}>Rebuild species & fusion</Text>
          </Pressable>
          <Pressable onPress={load} style={styles.refreshBtn} disabled={loading}>
            <Text style={styles.refreshText}>{loading ? 'Loading...' : 'Refresh'}</Text>
          </Pressable>
        </View>
      </View>

      <DevSlimeConsole onApplied={load} />

      <DevSettingsPanel />

      <RevealAnimationTestPanel speciesList={species} />

      <VariantRevealTestPanel speciesList={species} />

      <FusionAnimationTestPanel speciesList={species} />

      <VariantDropOddsPanel />

      <SleepRewardSimulator zones={zones} onApplied={load} />

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
        <Text style={styles.empty}>No sessions yet. Complete a {MIN_VALID_SLEEP_SECONDS}+ second sleep.</Text>
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
      <Text style={styles.mono}>
        equipped for sleep: {equippedSlimeId ?? '(none)'} | candies: {candyTotal}
      </Text>
      {slimes.length === 0 ? (
        <Text style={styles.empty}>No slimes. Earn from sleep.</Text>
      ) : (
        slimes.map((s) => {
          const spec = species.find((sp) => sp.id === s.speciesId);
          const tier = spec?.tier;
          const levelStatus =
            tier != null ? getSlimeLevelUpStatus(s, tier, candyTotal) : null;
          return (
            <View key={s.id} style={styles.row}>
              <Text style={styles.mono}>
                {s.id} | {spec?.name ?? s.speciesId} ({tier != null ? TIER_LABELS[tier] : '?'}) |
                L{s.level} | equipped nights: {s.equippedNights}
                {levelStatus && !levelStatus.atMaxLevel && levelStatus.requirement
                  ? ` / need ${levelStatus.nightsRequired}n + ${levelStatus.candiesRequired}c`
                  : ''}{' '}
                | variant: {SLIME_VARIANT_LABELS[s.variant]}
              </Text>
              {tier != null ? (
                <Text style={styles.mono}>
                  sleep bonus (L{s.level}): {describeEquippedSlimeBonus(tier, s.level)}
                </Text>
              ) : null}
              {levelStatus ? (
                <Text style={styles.mono}>
                  level-up:{' '}
                  {levelStatus.atMaxLevel
                    ? 'max level'
                    : levelStatus.canLevelUp
                      ? 'ready'
                      : `nights ${levelStatus.nightsMet ? 'ok' : `${levelStatus.equippedNights}/${levelStatus.nightsRequired}`}, candies ${levelStatus.candiesMet ? 'ok' : `${levelStatus.candyBalance}/${levelStatus.candiesRequired}`}`}
                </Text>
              ) : null}
              <View style={styles.slimeActions}>
                <Pressable
                  style={[
                    styles.smallBtn,
                    equippedSlimeId === s.id && styles.smallBtnActive,
                  ]}
                  onPress={() => setEquippedSlimeId(equippedSlimeId === s.id ? null : s.id)}
                >
                  <Text style={styles.smallBtnText}>
                    {equippedSlimeId === s.id ? 'Unequip' : 'Equip'}
                  </Text>
                </Pressable>
                {levelStatus?.canLevelUp ? (
                  <Pressable
                    style={styles.smallBtn}
                    onPress={async () => {
                      const res = await raiseSlimeLevel(s.id);
                      if (res.ok) await load();
                      else console.warn('level up failed', res.reason);
                    }}
                  >
                    <Text style={styles.smallBtnText}>Level up</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })
      )}

      <Text style={styles.sectionTitle}>species ({species.length})</Text>
      {species.map((s) => (
        <View key={s.id} style={styles.row}>
          <Text style={styles.mono}>{s.id} | {s.name} | set: {s.setId} | tier: {s.tier}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>fusion_rules ({fusionRules.length})</Text>
      {fusionRules.length === 0 ? (
        <Text style={styles.empty}>No fusion rules.</Text>
      ) : (
        fusionRules.map((r, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.mono}>
              {r.parentSpeciesA} + {r.parentSpeciesB} → {r.resultSpeciesId} | candy: {r.candyCost} |
              det: {r.deterministic ? '1' : '0'}
              {r.weight != null ? ` | weight: ${r.weight}` : ''}
            </Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>zones ({zones.length})</Text>
      {zones.map((z) => (
        <View key={z.id} style={styles.row}>
          <Text style={styles.mono}>{z.id} | {z.name} | unlockedByDefault: {z.unlockedByDefault ? '1' : '0'}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>zone_spawn_weights</Text>
      {zones.map((z) => (
        <View key={z.id} style={styles.row}>
          <Text style={styles.mono}>{z.id}:</Text>
          {(zoneSpawnTables[z.id] ?? []).map((row, i) => (
            <Text key={i} style={styles.mono}>  {row.speciesId} weight={row.weight}</Text>
          ))}
        </View>
      ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createAppStyles({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  backBtn: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: { color: '#7eb8ff', fontSize: 16, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    maxWidth: '60%',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  candies: { color: '#fff', fontSize: 16, fontWeight: '800' },
  refreshBtn: { padding: 8, backgroundColor: '#333', borderRadius: 6 },
  refreshText: { color: '#fff', fontSize: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#aaa', marginTop: 16, marginBottom: 6 },
  row: { backgroundColor: '#2a2a2a', padding: 10, borderRadius: 6, marginBottom: 6 },
  mono: { fontFamily: 'monospace', fontSize: 11, color: '#ccc', marginBottom: 2 },
  empty: { fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 8 },
  slimeActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#444',
    borderRadius: 6,
  },
  smallBtnActive: { backgroundColor: '#3d5a80' },
  smallBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
