/**
 * Tab layout — custom bottom bar: Fuse | Sleep | Collection.
 * Handles DB init + candies hydration.
 */

import { useEffect, useMemo, type ReactNode } from 'react';
import { Tabs } from 'expo-router';
import {
  type AccessibilityRole,
  type AccessibilityState,
  type GestureResponderEvent,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { getCandiesState, getDb } from '@/src/db';
import { refreshSleepStreakFromDb } from '@/src/services/sleepStreakSync';
import { hydrateEquippedSlimeFromDb, useCandiesStore, useSleepStore } from '@/src/stores';
import { CandyCounterPill } from '@/src/components/CandyCounterPill';
import { StreakCounterPill } from '@/src/components/StreakCounterPill';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const FUSE_ICON = require('../../assets/ui/fuse-icon.png');
const SLEEP_ICON = require('../../assets/ui/sleep-icon.png');

const TAB_ROUTE = {
  FUSION: 'fusion',
  SLEEP: 'index',
  COLLECTION: 'collection',
} as const;
type TabRouteName = (typeof TAB_ROUTE)[keyof typeof TAB_ROUTE];

const tabBarTheme = mainScreens.tabBar;
const tabFaces = mainScreens.idle;

type StyledTabBarButtonProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: ((event: GestureResponderEvent) => void) | null;
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  'aria-selected'?: boolean;
};

function isImmersiveSleepPhase(phase: string): boolean {
  // Intentionally hide both header + tab bar during non-idle sleep flow phases.
  return phase !== 'idle';
}

function StyledTabBarButton(props: StyledTabBarButtonProps) {
  const selected = Boolean(
    props.accessibilityState?.selected ??
      props['aria-selected']
  );

  return (
    <Pressable
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      accessibilityRole={props.accessibilityRole}
      accessibilityState={props.accessibilityState}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityHint={props.accessibilityHint}
      testID={props.testID}
      style={[props.style, styles.tabButtonPressable]}
    >
      <View
        style={[
          styles.tabButtonShadow,
          {
            borderRadius: tabBarTheme.buttonRadius,
            top: tabBarTheme.buttonShadowOffset,
            backgroundColor: selected
              ? tabFaces.tabSelectedShadow
              : tabFaces.tabShadow,
            opacity: selected ? 1 : 0.95,
          },
        ]}
      />
      <View
        style={[
          styles.tabButtonFace,
          {
            borderRadius: tabBarTheme.buttonRadius,
            bottom: tabBarTheme.buttonShadowOffset,
            backgroundColor: selected
              ? tabFaces.tabSelectedFill
              : tabFaces.tabFill,
          },
        ]}
      >
        {props.children}
      </View>
    </Pressable>
  );
}

function renderTabIcon(
  routeName: TabRouteName,
  focused: boolean,
  color: string,
  size?: number
) {
  const iconSize = (size ?? 24) + 6;
  const imageStyle = [
    styles.tabIconImage,
    { width: iconSize, height: iconSize, opacity: focused ? 1 : 0.85 },
  ];

  if (routeName === TAB_ROUTE.FUSION) {
    return <Image source={FUSE_ICON} style={imageStyle} resizeMode="contain" />;
  }

  if (routeName === TAB_ROUTE.SLEEP) {
    return <Image source={SLEEP_ICON} style={imageStyle} resizeMode="contain" />;
  }

  return (
    <Text style={[styles.collectionIconFallback, { color, fontSize: iconSize - 4 }]}>
      🗂
    </Text>
  );
}

async function initDbAndHydrateCandies(cancelledRef: { current: boolean }) {
  try {
    await getDb();
    if (cancelledRef.current) return;
    const savedCandies = await getCandiesState();
    if (!cancelledRef.current && savedCandies) {
      useCandiesStore.getState().hydrate(savedCandies);
    }
    if (!cancelledRef.current) await refreshSleepStreakFromDb();
    if (!cancelledRef.current) await hydrateEquippedSlimeFromDb();
  } catch (err) {
    console.warn('DB init failed:', err);
  }
}

export default function TabLayout() {
  const sleepPhase = useSleepStore((s) => s.phase);
  const immersiveSleep = isImmersiveSleepPhase(sleepPhase);

  useEffect(() => {
    const cancelledRef = { current: false };
    initDbAndHydrateCandies(cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const commonScreenOptions = useMemo(
    () => ({
      headerShown: !immersiveSleep,
      headerStyle: styles.headerStyle,
      headerTitleStyle: styles.headerTitleStyle,
      headerShadowVisible: false,
      tabBarActiveTintColor: tabBarTheme.labelActive,
      tabBarInactiveTintColor: tabBarTheme.labelInactive,
      tabBarStyle: immersiveSleep
        ? styles.tabBarHidden
        : [
            styles.tabBarBase,
            {
              backgroundColor: tabBarTheme.containerBg,
              height:
                Platform.OS === 'ios'
                  ? tabBarTheme.tabBarHeightIOS
                  : tabBarTheme.tabBarHeightAndroid,
            },
          ],
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarButton: (props: StyledTabBarButtonProps) => <StyledTabBarButton {...props} />,
    }),
    [immersiveSleep]
  );

  return (
    <Tabs
      screenOptions={({ route }) => {
        const showSharedCandyPill =
          !immersiveSleep && route.name !== TAB_ROUTE.SLEEP;
        return {
          ...commonScreenOptions,
          ...(showSharedCandyPill
            ? {
                headerLeft: () => <CandyCounterPill />,
              }
            : {}),
          tabBarIcon: ({ focused, color, size }) =>
            renderTabIcon(route.name as TabRouteName, focused, color, size),
        };
      }}
    >
      <Tabs.Screen
        name={TAB_ROUTE.FUSION}
        options={{
          title: 'Fuse',
          tabBarLabel: 'Fuse',
          headerTitle: () => null,
          headerStyle: {
            backgroundColor: mainScreens.fuse.bg,
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      />
      <Tabs.Screen
        name={TAB_ROUTE.SLEEP}
        options={{
          title: 'Sleep',
          tabBarLabel: 'Sleep',
          headerTitle: () => null,
          headerLeft: () => <CandyCounterPill />,
          headerRight: () => <StreakCounterPill />,
          headerStyle: {
            backgroundColor: mainScreens.idle.bg,
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      />
      <Tabs.Screen
        name={TAB_ROUTE.COLLECTION}
        options={{
          title: 'Collection',
          tabBarLabel: 'Collection',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: mainScreens.fuse.bg,
    borderBottomWidth: 1,
    borderBottomColor: mainScreens.fuse.border,
  },
  headerTitleStyle: {
    fontFamily: APP_FONT_FAMILY,
    fontWeight: '800',
    fontSize: 17,
    color: mainScreens.fuse.primaryText,
  },
  tabBarBase: {
    borderTopColor: '#8a8a8a',
    borderTopWidth: 6,
    borderLeftColor: '#7a7a7a',
    borderLeftWidth: 0,
    borderRightColor: '#7a7a7a',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  tabBarHidden: { display: 'none', height: 0 },
  tabBarLabel: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  tabButtonPressable: {
    flex: 1,
    alignSelf: 'stretch',
    marginHorizontal: tabBarTheme.horizontalGap,
    marginVertical: 6,
    paddingBottom: tabBarTheme.buttonShadowOffset,
  },
  tabButtonShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabButtonFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  tabIconImage: {
    width: 30,
    height: 30,
  },
  collectionIconFallback: {
    lineHeight: 30,
  },
});
