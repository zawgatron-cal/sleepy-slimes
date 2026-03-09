/**
 * Root layout — initializes app and SQLite, wraps with error boundary.
 * Expo Router entry: stack for modal/not-found, and (tabs) group for main screens.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { getDb } from '@/src/db';

export default function RootLayout() {
  useEffect(() => {
    getDb().catch((err) => console.warn('DB init failed:', err));
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}
