/**
 * Persist in-progress sleep sessions so tracking survives app restarts.
 */

import { getPlayerSetting, setPlayerSetting } from '@/src/db';
import { PLAYER_SETTING_KEYS } from '@/src/constants/playerSettings';
import { useSleepStore } from '@/src/stores';

export type ActiveSleepSessionPayload = {
  startedAt: number;
  zoneId: string;
  alarmAt: number | null;
};

export async function saveActiveSleepSession(
  payload: ActiveSleepSessionPayload
): Promise<void> {
  await setPlayerSetting(
    PLAYER_SETTING_KEYS.ACTIVE_SLEEP_SESSION,
    JSON.stringify(payload)
  );
}

export async function clearActiveSleepSession(): Promise<void> {
  await setPlayerSetting(PLAYER_SETTING_KEYS.ACTIVE_SLEEP_SESSION, null);
}

export async function loadActiveSleepSession(): Promise<ActiveSleepSessionPayload | null> {
  const raw = await getPlayerSetting(PLAYER_SETTING_KEYS.ACTIVE_SLEEP_SESSION);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ActiveSleepSessionPayload>;
    if (
      typeof parsed.startedAt !== 'number' ||
      typeof parsed.zoneId !== 'string' ||
      !parsed.zoneId
    ) {
      return null;
    }
    return {
      startedAt: parsed.startedAt,
      zoneId: parsed.zoneId,
      alarmAt: typeof parsed.alarmAt === 'number' ? parsed.alarmAt : null,
    };
  } catch {
    return null;
  }
}

/** Restore tracking UI after relaunch if a session was interrupted. */
export async function restoreActiveSleepSessionIfNeeded(): Promise<boolean> {
  const { phase } = useSleepStore.getState();
  if (phase !== 'idle') return false;

  const saved = await loadActiveSleepSession();
  if (!saved) return false;

  useSleepStore.getState().resumeSession(saved);
  return true;
}
