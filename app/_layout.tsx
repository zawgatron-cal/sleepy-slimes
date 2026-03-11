/**
 * Root layout — initializes app and SQLite, wraps with error boundary.
 * Expo Router entry: stack for modal/not-found, and (tabs) group for main screens.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { getCandiesState, getDb } from '@/src/db';
import { useCandiesStore } from '@/src/stores';

export default function RootLayout() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await getDb();

        const saved = await getCandiesState();
        if (saved && !cancelled) {
          useCandiesStore.getState().hydrate(saved);
        }
      } catch (err) {
        console.warn('DB init failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="dev" options={{ title: 'Dev' }} />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}
