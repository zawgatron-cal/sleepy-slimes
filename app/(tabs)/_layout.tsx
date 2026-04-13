/**
 * Tab layout — ui-one.pdf bottom bar: Fuse | Sleep | Collection.
 * DB init and candies hydration run here (deferred).
 */

import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCandiesState, getDb } from '@/src/db';
import { useCandiesStore, useSleepStore } from '@/src/stores';
import { uiOne } from '@/src/theme/uiOne';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

function CandiesHeaderLeft() {
  const candies = useCandiesStore((s) => s.total);
  return (
    <View style={{ paddingLeft: 14 }}>
      <Text style={{ fontFamily: APP_FONT_FAMILY, fontSize: 15, fontWeight: '800', color: uiOne.text }}>
        🍬 {candies}
      </Text>
    </View>
  );
}

const defaultTabBarStyle = {
  backgroundColor: uiOne.tabBarBg,
  borderTopColor: uiOne.tabBarBorder,
  borderTopWidth: 1,
  height: Platform.OS === 'ios' ? 88 : 64,
  paddingTop: 6,
  paddingBottom: Platform.OS === 'ios' ? 28 : 10,
} as const;

export default function TabLayout() {
  const sleepPhase = useSleepStore((s) => s.phase);
  /** Sleep flow phases are full-screen: hide header (top) and tab bar (bottom). */
  const immersiveSleep = sleepPhase !== 'idle';

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      getDb()
        .then(() => (cancelled ? null : getCandiesState()))
        .then((saved) => {
          if (saved && !cancelled) useCandiesStore.getState().hydrate(saved);
        })
        .catch((err) => console.warn('DB init failed:', err));
    }, 50);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: !immersiveSleep,
        headerStyle: {
          backgroundColor: uiOne.bg,
          borderBottomWidth: 1,
          borderBottomColor: uiOne.border,
        },
        headerTitleStyle: {
          fontFamily: APP_FONT_FAMILY,
          fontWeight: '800',
          fontSize: 17,
          color: uiOne.text,
        },
        headerShadowVisible: false,
        headerLeft: immersiveSleep ? undefined : () => <CandiesHeaderLeft />,
        tabBarActiveTintColor: uiOne.primary,
        tabBarInactiveTintColor: uiOne.textSubtle,
        tabBarStyle: immersiveSleep
          ? { display: 'none', height: 0 }
          : defaultTabBarStyle,
        tabBarLabelStyle: {
          fontFamily: APP_FONT_FAMILY,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
        tabBarIcon: ({ color, size }) => {
          const s = size ?? 22;
          if (route.name === 'fusion') {
            return <Ionicons name="git-merge-outline" size={s} color={color} />;
          }
          if (route.name === 'index') {
            return <Ionicons name="moon-outline" size={s} color={color} />;
          }
          return <Ionicons name="grid-outline" size={s} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="fusion"
        options={{
          title: 'Fuse',
          tabBarLabel: 'Fuse',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sleep',
          tabBarLabel: 'Sleep',
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Collection',
          tabBarLabel: 'Collection',
        }}
      />
    </Tabs>
  );
}
