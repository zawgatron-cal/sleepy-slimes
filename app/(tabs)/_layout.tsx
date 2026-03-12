/**
 * Tab layout — main navigation: Fusion | Sleep | Collection.
 * DB init and candies hydration run here (deferred) so root layout never blocks on DB.
 */

import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { getCandiesState, getDb } from '@/src/db';
import { useCandiesStore } from '@/src/stores';

function CandiesHeaderLeft() {
  const candies = useCandiesStore((s) => s.total);
  return (
    <View style={{ paddingLeft: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: '700' }}>🍬 {candies}</Text>
    </View>
  );
}

export default function TabLayout() {
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
