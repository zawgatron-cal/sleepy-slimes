/**
 * Root layout — renders app shell immediately. No DB access here so first paint is never blocked.
 * Candies are hydrated from DB when the tab layout mounts (see app/(tabs)/_layout.tsx).
 */

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="dev" options={{ title: 'Dev' }} />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}
