/**
 * Sleep Data screen state: sessions, aggregates, manual entry.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  getCandiesState,
  getSleepSessions,
  getSlimes,
  insertSleepSession,
} from '@/src/db';
import { ZONES } from '@/src/data';
import { refreshSleepStreakFromDb } from '@/src/services/sleepStreakSync';
import type { SleepSession } from '@/src/types';
import {
  computeAverageSleepDurationHours,
  formatAverageSleepDuration,
} from '@/src/utils/sleepDataAvgDuration';
import { getSleepDataLogSessions } from '@/src/utils/sleepDataLogFormat';
import {
  computeSleepConsistencyScore,
  formatSleepConsistencyScore,
} from '@/src/utils/sleepDataConsistency';
import {
  computeAverageSleepQuality,
  computeSleepQualityScore,
  formatSleepQualityScore,
} from '@/src/utils/sleepQuality';
import {
  buildSleepDataWeekDays,
  getSleepDataWeekMonthLabel,
} from '@/src/utils/sleepDataWeekChart';

function defaultManualStart(): Date {
  const d = new Date();
  d.setHours(23, 0, 0, 0);
  return d;
}

function defaultManualEnd(): Date {
  const d = new Date();
  d.setHours(7, 0, 0, 0);
  return d;
}

export function useSleepDataScreen() {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [slimeCount, setSlimeCount] = useState(0);
  const [candyTotal, setCandyTotal] = useState(0);
  const [qualityInfoVisible, setQualityInfoVisible] = useState(false);
  const [consistencyInfoVisible, setConsistencyInfoVisible] = useState(false);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  const [manualStart, setManualStart] = useState(defaultManualStart);
  const [manualEnd, setManualEnd] = useState(defaultManualEnd);
  const [activeManualField, setActiveManualField] = useState<'start' | 'end'>('start');
  const [showManualPicker, setShowManualPicker] = useState(false);

  const reload = useCallback(async () => {
    const [rows, slimes, candies] = await Promise.all([
      getSleepSessions(),
      getSlimes(),
      getCandiesState(),
    ]);
    setSessions(rows);
    setSlimeCount(slimes.length);
    setCandyTotal(candies?.total ?? 0);
    await refreshSleepStreakFromDb();
  }, []);

  useEffect(() => {
    reload().catch((e) => console.warn('Sleep data load failed', e));
  }, [reload]);

  const weekDays = useMemo(() => buildSleepDataWeekDays(sessions), [sessions]);
  const monthLabel = useMemo(() => getSleepDataWeekMonthLabel(weekDays), [weekDays]);
  const logSessions = useMemo(() => getSleepDataLogSessions(sessions), [sessions]);
  const consistencyScore = useMemo(() => computeSleepConsistencyScore(sessions), [sessions]);
  const consistencyDisplay = useMemo(
    () => formatSleepConsistencyScore(consistencyScore),
    [consistencyScore]
  );
  const avgDurationHours = useMemo(() => computeAverageSleepDurationHours(sessions), [sessions]);
  const avgDurationDisplay = useMemo(
    () => formatAverageSleepDuration(avgDurationHours),
    [avgDurationHours]
  );
  const avgQualityScore = useMemo(() => computeAverageSleepQuality(sessions), [sessions]);
  const avgQualityDisplay = useMemo(
    () => formatSleepQualityScore(avgQualityScore),
    [avgQualityScore]
  );

  const openManualEntry = useCallback(() => {
    setActiveManualField('start');
    setShowManualPicker(false);
    setManualEntryVisible(true);
  }, []);

  const closeManualEntry = useCallback(() => {
    setShowManualPicker(false);
    setManualEntryVisible(false);
  }, []);

  // DEV: swipe-to-delete on Sleep Data log — see app/sleep-data.tsx
  // const deleteSession = useCallback(async (id: string) => { ... }, [reload]);

  const saveManualEntry = useCallback(async () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(manualStart.getHours(), manualStart.getMinutes(), 0, 0);
    const end = new Date(now);
    end.setHours(manualEnd.getHours(), manualEnd.getMinutes(), 0, 0);
    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1);
    }

    const startedAt = start.getTime();
    const endedAt = end.getTime();
    const durationMs = endedAt - startedAt;
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationMs < 30 * 1000) {
      Alert.alert('Too short', 'Sleep duration must be at least 30 seconds.');
      return;
    }

    const session: SleepSession = {
      id: `session_${Date.now()}`,
      zoneId: ZONES.GRASSY_MEADOW.id,
      startedAt,
      endedAt,
      durationHours,
      quality: computeSleepQualityScore(durationHours),
      candiesEarned: 0,
    };

    try {
      await insertSleepSession(session);
      closeManualEntry();
      await reload();
    } catch (e) {
      console.warn('insertSleepSession failed', e);
      Alert.alert('Error', 'Could not save sleep session.');
    }
  }, [manualStart, manualEnd, closeManualEntry, reload]);

  return {
    sessions,
    slimeCount,
    candyTotal,
    weekDays,
    monthLabel,
    logSessions,
    consistencyScore,
    consistencyDisplay,
    avgDurationHours,
    avgDurationDisplay,
    avgQualityScore,
    avgQualityDisplay,
    qualityInfoVisible,
    setQualityInfoVisible,
    consistencyInfoVisible,
    setConsistencyInfoVisible,
    manualEntryVisible,
    manualStart,
    setManualStart,
    manualEnd,
    setManualEnd,
    activeManualField,
    setActiveManualField,
    showManualPicker,
    setShowManualPicker,
    openManualEntry,
    closeManualEntry,
    saveManualEntry,
  };
}
