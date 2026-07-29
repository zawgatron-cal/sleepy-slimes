/**
 * Root layout — loads Itim, applies Text/TextInput defaults before first paint of app content.
 */

import 'react-native-reanimated';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts, Itim_400Regular } from '@expo-google-fonts/itim';
import * as SplashScreen from 'expo-splash-screen';
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Itim_400Regular,
  });

  useEffect(() => {
    if (fontError) {
      console.warn('Font load failed:', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="dreamer-fusion" options={{ title: 'Slime Temple' }} />
      {__DEV__ ? <Stack.Screen name="dev" options={{ title: 'Dev' }} /> : null}
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}
