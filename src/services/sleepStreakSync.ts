import { getSleepSessions } from '@/src/db';
import { useSleepStore } from '@/src/stores';
import { computeStreakStats } from '@/src/utils/sleepStreak';

export async function refreshSleepStreakFromDb(): Promise<void> {
  const sessions = await getSleepSessions();
  const { currentStreak, longestStreak, lastStreakDate } =
    computeStreakStats(sessions);
  useSleepStore.getState().setStreak(currentStreak, longestStreak, lastStreakDate);
}
