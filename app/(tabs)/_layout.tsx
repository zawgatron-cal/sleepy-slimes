/**
 * Tab layout — main navigation: Fusion | Sleep | Collection.
 * DB init and candies hydration run here (deferred) so root layout never blocks on DB.
 */

import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { getCandiesState, getDb } from '@/src/db';
import { refreshSleepStreakFromDb } from '@/src/services/refreshSleepStreakFromDb';
import { useCandiesStore, useSleepStore } from '@/src/stores';

function CandiesHeaderLeft() {
  const candies = useCandiesStore((s) => s.total);
  return (
    <View style={{ paddingLeft: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: '700' }}>🍬 {candies}</Text>
    </View>
  );
}

function SleepStreakHeaderRight() {
  const streak = useSleepStore((s) => s.currentStreak);
  return (
    <View style={{ paddingRight: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: '700' }}>🔥 {streak}</Text>
    </View>
  );
}

export default function TabLayout() {
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      getDb()
        .then(async () => {
          if (cancelled) return;
          const saved = await getCandiesState();
          if (saved) useCandiesStore.getState().hydrate(saved);
          await refreshSleepStreakFromDb();
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
      screenOptions={{
        tabBarActiveTintColor: '#333',
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: '#f5f5f5' },
        headerTitleStyle: { fontWeight: '600' },
        headerLeft: () => <CandiesHeaderLeft />,
      }}
    >
      <Tabs.Screen
        name="fusion"
        options={{
          title: 'Fusion',
          tabBarLabel: 'Fusion',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sleep',
          tabBarLabel: 'Sleep',
          headerRight: () => <SleepStreakHeaderRight />,
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
