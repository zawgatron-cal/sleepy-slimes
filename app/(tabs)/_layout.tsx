/**
 * Tab layout — main navigation: Fusion | Sleep | Collection.
 * PRD daily loop: Evening = zone + optional fuse + start sleep; Morning = log + candies + optional fuse.
 */

import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
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
