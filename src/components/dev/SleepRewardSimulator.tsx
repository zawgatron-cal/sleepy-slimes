/**
 * Dev — dry-run or apply sleep reward rolls (candy + slime count/species).
 */

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { Zone } from '@/src/types';
import { MIN_VALID_SLEEP_SECONDS } from '@/src/constants/game';
import { SLIME_VARIANT_DROP_TABLE } from '@/src/constants/game';
import {
  expectedVariantDropPct,
  formatMinValidSleepHint,
  formatVariantTotalsLine,
  simulateSleepRewards,
  type SimulateSleepRewardsResult,
} from '@/src/services/sleepRewardsSim';
import { createAppStyles } from '@/src/theme/createAppStyles';

type Props = {
  zones: Zone[];
  onApplied?: () => void;
};

export function SleepRewardSimulator({ zones, onApplied }: Props) {
  const defaultZoneId = zones[0]?.id ?? 'grassy_meadow';
  const [zoneId, setZoneId] = useState(defaultZoneId);
  const [durationHours, setDurationHours] = useState('8');
  const [runCount, setRunCount] = useState('10');
  const [applyRewards, setApplyRewards] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulateSleepRewardsResult | null>(null);

  const durationSeconds = useMemo(() => {
    const h = parseFloat(durationHours);
    if (!Number.isFinite(h) || h < 0) return 0;
    return h * 3600;
  }, [durationHours]);

  const parsedRunCount = useMemo(() => {
    const n = parseInt(runCount, 10);
    return Number.isFinite(n) && n >= 1 ? Math.min(n, 500) : 1;
  }, [runCount]);

  const applyAllowed = parsedRunCount === 1;

  const handleRun = async () => {
    if (durationSeconds < MIN_VALID_SLEEP_SECONDS) {
      Alert.alert('Invalid duration', formatMinValidSleepHint());
      return;
    }
    if (applyRewards && !applyAllowed) {
      Alert.alert('Apply rewards', 'Turn off multi-run or set runs to 1 to apply to your save.');
      return;
    }

    setRunning(true);
    setResult(null);
    try {
      const out = await simulateSleepRewards({
        durationSeconds,
        zoneId,
        runCount: parsedRunCount,
        applyRewards: applyRewards && applyAllowed,
      });
      setResult(out);
      if (out.applied) {
        onApplied?.();
      }
    } catch (e) {
      console.warn('simulateSleepRewards failed', e);
      Alert.alert('Simulation failed', String(e));
    } finally {
      setRunning(false);
    }
  };

  const lastRun = result?.runs[result.runs.length - 1];

  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>Simulate sleep rewards</Text>
      <Text style={styles.hint}>
        Rolls candy + slime logic from `sleepRewards`. Default is dry-run only.
      </Text>

      <Text style={styles.label}>Zone id</Text>
      <TextInput
        style={styles.input}
        value={zoneId}
        onChangeText={setZoneId}
        autoCapitalize="none"
        placeholder={defaultZoneId}
      />
      {zones.length > 0 ? (
        <View style={styles.chipRow}>
          {zones.map((z) => (
            <Pressable
              key={z.id}
              style={[styles.chip, zoneId === z.id && styles.chipActive]}
              onPress={() => setZoneId(z.id)}
            >
              <Text style={[styles.chipText, zoneId === z.id && styles.chipTextActive]}>
                {z.id}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Duration (hours)</Text>
      <TextInput
        style={styles.input}
        value={durationHours}
        onChangeText={setDurationHours}
        keyboardType="decimal-pad"
        placeholder="8"
      />
      <Text style={styles.mini}>{formatMinValidSleepHint()}</Text>

      <Text style={styles.label}>Number of runs</Text>
      <TextInput
        style={styles.input}
        value={runCount}
        onChangeText={setRunCount}
        keyboardType="number-pad"
        placeholder="10"
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Apply rewards to save</Text>
        <Switch
          value={applyRewards}
          onValueChange={setApplyRewards}
          disabled={!applyAllowed}
        />
      </View>
      {!applyAllowed ? (
        <Text style={styles.mini}>Apply is only available when runs = 1.</Text>
      ) : (
        <Text style={styles.mini}>Writes session, candies, slimes, and refreshes streak.</Text>
      )}

      <Pressable
        style={[styles.runBtn, running && styles.runBtnDisabled]}
        onPress={handleRun}
        disabled={running}
      >
        {running ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.runBtnText}>
            {parsedRunCount === 1 ? 'Simulate 1 session' : `Simulate ${parsedRunCount} (average)`}
          </Text>
        )}
      </Pressable>

      {result ? (
        <View style={styles.results}>
          {result.applied ? (
            <Text style={styles.appliedBanner}>Applied to DB + stores</Text>
          ) : (
            <Text style={styles.dryBanner}>Dry run — nothing saved</Text>
          )}

          {lastRun ? (
            <View style={styles.row}>
              <Text style={styles.mono}>
                Last run: valid={lastRun.valid ? 'yes' : 'no'} | streak={lastRun.streakValue} |
                candies={lastRun.candies} | slimes={lastRun.slimeCount}
              </Text>
              {lastRun.valid && lastRun.speciesIds.length > 0 ? (
                <Text style={styles.mono}>species (last run): {lastRun.speciesIds.join(', ')}</Text>
              ) : null}
            </View>
          ) : null}

          {result.variantTotals.totalSlimes > 0 ? (
            <View style={styles.row}>
              <Text style={styles.mono}>
                Variants ({result.variantTotals.totalSlimes} slimes /{' '}
                {result.variantTotals.validRunCount} valid runs):
              </Text>
              {SLIME_VARIANT_DROP_TABLE.map(({ variant }) => (
                <Text key={variant} style={styles.mono}>
                  {formatVariantTotalsLine(
                    variant,
                    result.variantTotals.counts[variant],
                    result.variantTotals.totalSlimes
                  )}{' '}
                  — expected ~{expectedVariantDropPct(variant)}%
                </Text>
              ))}
            </View>
          ) : null}

          {result.averages ? (
            <View style={styles.row}>
              <Text style={styles.mono}>
                Average ({result.averages.validRunCount} valid / {result.runs.length} runs): candies=
                {result.averages.candies.toFixed(2)} | slimes=
                {result.averages.slimeCount.toFixed(2)}
              </Text>
            </View>
          ) : null}

          {parsedRunCount > 1 && result.runs.length <= 20 ? (
            <View style={styles.row}>
              <Text style={styles.mono}>Per run (candies / slimes):</Text>
              {result.runs.map((r, i) => (
                <Text key={i} style={styles.mono}>
                  #{i + 1}: {r.valid ? `${r.candies} 🍬, ${r.slimeCount} slimes` : 'invalid'}
                </Text>
              ))}
            </View>
          ) : parsedRunCount > 1 ? (
            <Text style={styles.mini}>Per-run list hidden for runs &gt; 20.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = createAppStyles({
  block: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#252525',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9cf',
    marginBottom: 6,
  },
  hint: { fontSize: 12, color: '#888', marginBottom: 12, lineHeight: 17 },
  label: { fontSize: 12, fontWeight: '600', color: '#aaa', marginTop: 8, marginBottom: 4 },
  mini: { fontSize: 11, color: '#666', marginBottom: 4 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  chipActive: { backgroundColor: '#4a6a8a' },
  chipText: { fontSize: 11, color: '#aaa' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  switchLabel: { fontSize: 13, color: '#ccc', flex: 1, paddingRight: 8 },
  runBtn: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#3d5a80',
    borderRadius: 8,
    alignItems: 'center',
  },
  runBtnDisabled: { opacity: 0.6 },
  runBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  results: { marginTop: 14 },
  appliedBanner: { fontSize: 12, fontWeight: '700', color: '#8f8', marginBottom: 8 },
  dryBanner: { fontSize: 12, fontWeight: '700', color: '#cc8', marginBottom: 8 },
  row: { backgroundColor: '#2a2a2a', padding: 10, borderRadius: 6, marginBottom: 6 },
  mono: { fontFamily: 'monospace', fontSize: 11, color: '#ccc', marginBottom: 2 },
});
