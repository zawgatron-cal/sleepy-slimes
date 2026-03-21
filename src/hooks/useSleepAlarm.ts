/**
 * Alarm side effects during sleep tracking: preload sound, schedule OS notification,
 * start/stop in-app loop when alarm time passes (uses `currentTime` tick from useTrackingPhaseUI).
 */

import { useEffect, useState } from 'react';
import type { SleepPhase } from '@/src/stores/useSleepStore';
import {
  requestPermissions,
  scheduleAlarm,
  preloadAlarmSound,
  startAlarmLoop,
  stopAlarmLoop,
} from '@/src/services/alarmNotifications';

export function useSleepAlarm(
  phase: SleepPhase,
  alarmAt: number | null,
  currentTime: number
): void {
  const [alarmLoopStarted, setAlarmLoopStarted] = useState(false);

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

  useEffect(() => {
    if (phase !== 'tracking' || !alarmAt || alarmAt <= Date.now()) return;
    let cancelled = false;
    (async () => {
      const ok = await requestPermissions();
      if (!ok || cancelled) return;
      await scheduleAlarm(alarmAt);
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, alarmAt]);

  useEffect(() => {
    if (phase === 'tracking' && alarmAt && alarmAt <= currentTime && !alarmLoopStarted) {
      setAlarmLoopStarted(true);
      startAlarmLoop().catch((e) => console.warn('startAlarmLoop failed', e));
    }
    if (phase !== 'tracking' && alarmLoopStarted) {
      stopAlarmLoop();
      setAlarmLoopStarted(false);
    }
  }, [phase, alarmAt, alarmLoopStarted, currentTime]);
}
