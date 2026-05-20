import { getSleepSessions } from '@/src/db';
import { useSleepStore } from '@/src/stores';
import { computeStreakSummaryFromSessions } from '@/src/services/sleepStreak';

/** Recompute streak from persisted sleep_sessions and sync the sleep store. */
export async function refreshSleepStreakFromDb(): Promise<void> {
  try {
    const sessions = await getSleepSessions();
    const { currentStreak, longestStreak, lastStreakDate } =
      computeStreakSummaryFromSessions(sessions);
    useSleepStore.getState().setStreak(currentStreak, longestStreak, lastStreakDate);
  } catch (e) {
    console.warn('refreshSleepStreakFromDb failed', e);
  }
}
