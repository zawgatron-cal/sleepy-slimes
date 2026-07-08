/**
 * Tab layout — custom bottom bar: Fuse | Sleep | Collection.
 * Handles DB init + candies hydration.
 */

import { useEffect, useMemo, useRef, useCallback, useState, type ReactNode } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
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
import { restoreActiveSleepSessionIfNeeded } from '@/src/services/activeSleepSession';
import { useBackgroundMusic } from '@/src/hooks/useBackgroundMusic';
import {
  hydrateEquippedSlimeFromDb,
  hydrateSoundSettingsFromDb,
  hydrateTutorialFromDb,
  useCandiesStore,
  useCandyCollectStore,
  useCollectionRevealStore,
  useCollectionStore,
  useSleepStore,
  useTutorialCompletedSteps,
  useTutorialStepComplete,
  useTutorialStore,
} from '@/src/stores';
import { CandyCounterPill } from '@/src/components/CandyCounterPill';
import { CandyCollectScrim } from '@/src/components/sleep/CandyCollectScrim';
import { SleepTabHeader } from '@/src/components/sleep/SleepTabHeader';
import {
  TutorialTapPrompt,
  TutorialNpcDialogue,
  type TutorialTapTargetRect,
} from '@/src/components';
import { TUTORIAL_COPY, TUTORIAL_TAP } from '@/src/constants/tutorial';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';
import {
  isCollectionTabUnlocked,
  isFusionTabUnlocked,
} from '@/src/utils/tutorialTabUnlock';
import type { TutorialStepId } from '@/src/constants/tutorial';

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
  disabled?: boolean | null;
  locked?: boolean;
};

function isSleepTabPath(pathname: string): boolean {
  return !pathname.includes('/collection') && !pathname.includes('/fusion');
}

function isImmersiveSleepPhase(phase: string, isSleepTabFocused: boolean): boolean {
  // Hide header + tab bar only on the sleep tab during active sleep flow.
  return isSleepTabFocused && phase !== 'idle';
}

function StyledTabBarButton(props: StyledTabBarButtonProps) {
  const selected = Boolean(
    props.accessibilityState?.selected ??
      props['aria-selected']
  );
  const disabled = props.disabled ?? false;
  const locked = props.locked ?? false;
  const showSelected = selected && !locked;

  const face = (
    <>
      <View
        style={[
          styles.tabButtonShadow,
          {
            borderRadius: tabBarTheme.buttonRadius,
            top: tabBarTheme.buttonShadowOffset,
            backgroundColor: locked
              ? stylesLocked.tabShadow
              : showSelected
                ? tabFaces.tabSelectedShadow
                : tabFaces.tabShadow,
            opacity: locked ? 1 : showSelected ? 1 : 0.95,
          },
        ]}
      />
      <View
        style={[
          styles.tabButtonFace,
          {
            borderRadius: tabBarTheme.buttonRadius,
            bottom: tabBarTheme.buttonShadowOffset,
            backgroundColor: locked
              ? stylesLocked.tabFill
              : showSelected
                ? tabFaces.tabSelectedFill
                : tabFaces.tabFill,
          },
        ]}
      >
        {locked ? <View style={styles.lockedTabInnerSlot} /> : props.children}
      </View>
    </>
  );

  if (locked) {
    return (
      <View
        style={[props.style, styles.tabButtonPressable, styles.tabButtonLocked]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {face}
      </View>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={disabled ? undefined : props.onPress}
      onLongPress={disabled ? undefined : props.onLongPress}
      accessibilityRole={props.accessibilityRole}
      accessibilityState={{ ...props.accessibilityState, disabled }}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityHint={props.accessibilityHint}
      testID={props.testID}
      style={[props.style, styles.tabButtonPressable]}
    >
      {face}
    </Pressable>
  );
}

const stylesLocked = {
  tabFill: '#353535',
  tabShadow: '#2A2A2A',
} as const;

function renderTabIcon(
  routeName: TabRouteName,
  focused: boolean,
  color: string,
  size?: number,
  locked = false
) {
  if (locked) return null;

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

function TabBarCollectBackground() {
  return <View style={[StyleSheet.absoluteFillObject, styles.tabBarBackgroundFill]} />;
}

function TabBarCollectScrimOverlay() {
  const height =
    Platform.OS === 'ios'
      ? tabBarTheme.tabBarHeightIOS
      : tabBarTheme.tabBarHeightAndroid;

  return (
    <View style={[styles.tabBarScrimOverlay, { height }]} pointerEvents="none">
      <CandyCollectScrim pointerEvents="none" />
    </View>
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
    if (!cancelledRef.current) await hydrateSoundSettingsFromDb();
    if (!cancelledRef.current) await hydrateTutorialFromDb();
    if (!cancelledRef.current) await restoreActiveSleepSessionIfNeeded();
  } catch (err) {
    console.warn('DB init failed:', err);
  }
}

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const layoutRootRef = useRef<View>(null);
  const fuseTabRef = useRef<View>(null);
  const [fuseTabTapRect, setFuseTabTapRect] = useState<TutorialTapTargetRect | null>(null);
  const [showFuseUnlockTutorial, setShowFuseUnlockTutorial] = useState(false);
  const sleepPhase = useSleepStore((s) => s.phase);
  const candyCollectActive = useCandyCollectStore((s) => s.active);
  const collectionRevealing = useCollectionRevealStore(
    (s) => s.isRevealing || s.pendingSlimeIds.length > 0
  );
  const tutorialHydrated = useTutorialStore((s) => s.hydrated);
  const completedSteps = useTutorialCompletedSteps();
  const fuseUnlockComplete = useTutorialStepComplete('fuse_unlock');
  const fuseUnlockRequested = useTutorialStore((s) => s.fuseUnlockRequested);
  const fuseTabOpened = useTutorialStore((s) => s.fuseTabOpened);
  const clearFuseUnlockRequest = useTutorialStore((s) => s.clearFuseUnlockRequest);
  const isOnboardingComplete = completedSteps.includes('fusion_guide');
  const completeTutorialStep = useTutorialStore((s) => s.completeStep);
  const slimesCount = useCollectionStore((s) => s.slimes.length);
  const unlockCheck = {
    hydrated: tutorialHydrated,
    isStepComplete: (step: TutorialStepId) => completedSteps.includes(step),
    isOnboardingComplete,
    slimesCount,
  };
  const collectionUnlocked = isCollectionTabUnlocked(unlockCheck);
  const fusionUnlocked = isFusionTabUnlocked(unlockCheck);
  const gesturesLocked = candyCollectActive || collectionRevealing;
  const isSleepTabFocused = isSleepTabPath(pathname);
  const isFusionTabFocused = pathname.includes('/fusion');
  const immersiveSleep = isImmersiveSleepPhase(sleepPhase, isSleepTabFocused);
  const showFuseTabTapPrompt =
    tutorialHydrated &&
    fuseUnlockComplete &&
    !fuseTabOpened &&
    !isFusionTabFocused &&
    !immersiveSleep &&
    !gesturesLocked &&
    !showFuseUnlockTutorial;
  const showTabBarCollectScrim = candyCollectActive && !immersiveSleep;

  useBackgroundMusic(!immersiveSleep);

  const updateFuseTabTapPos = useCallback(() => {
    if (!showFuseTabTapPrompt || !fuseTabRef.current || !layoutRootRef.current) return;
    fuseTabRef.current.measureLayout(
      layoutRootRef.current,
      (x, y, w, h) => {
        if (w > 0 && h > 0) setFuseTabTapRect({ x, y, width: w, height: h });
      },
      () => setFuseTabTapRect(null)
    );
  }, [showFuseTabTapPrompt]);

  useEffect(() => {
    if (!showFuseTabTapPrompt) {
      setFuseTabTapRect(null);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tryMeasure = () => {
      if (cancelled) return;
      if (!fuseTabRef.current || !layoutRootRef.current) {
        if (attempts < 12) {
          attempts += 1;
          setTimeout(tryMeasure, 100);
        }
        return;
      }
      fuseTabRef.current.measureLayout(
        layoutRootRef.current,
        (x, y, w, h) => {
          if (cancelled) return;
          if (w > 0 && h > 0) setFuseTabTapRect({ x, y, width: w, height: h });
        },
        () => {
          if (!cancelled && attempts < 12) {
            attempts += 1;
            setTimeout(tryMeasure, 100);
          }
        }
      );
    };
    const timer = setTimeout(tryMeasure, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showFuseTabTapPrompt, fusionUnlocked]);

  useEffect(() => {
    if (!tutorialHydrated) return;
    if (!fuseUnlockRequested || fuseUnlockComplete) return;
    if (immersiveSleep || gesturesLocked) return;

    clearFuseUnlockRequest();
    setShowFuseUnlockTutorial(true);
  }, [
    tutorialHydrated,
    fuseUnlockRequested,
    fuseUnlockComplete,
    immersiveSleep,
    gesturesLocked,
    clearFuseUnlockRequest,
  ]);

  useEffect(() => {
    const cancelledRef = { current: false };
    initDbAndHydrateCandies(cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (!tutorialHydrated) return;
    if (pathname.includes('/fusion') && !fusionUnlocked) {
      router.replace('/(tabs)/index');
      return;
    }
    if (pathname.includes('/collection') && !collectionUnlocked) {
      router.replace('/(tabs)/index');
    }
  }, [tutorialHydrated, pathname, fusionUnlocked, collectionUnlocked, router]);

  const commonScreenOptions = useMemo(
    () => ({
      headerShown: !immersiveSleep,
      headerStyle: styles.headerStyle,
      headerTitleStyle: styles.headerTitleStyle,
      headerShadowVisible: false,
      sceneStyle: styles.tabScene,
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
      tabBarButton: (props: StyledTabBarButtonProps) => (
        <StyledTabBarButton {...props} disabled={gesturesLocked || !!props.disabled} />
      ),
      tabBarBackground: () => <TabBarCollectBackground />,
    }),
    [gesturesLocked, immersiveSleep]
  );

  const fusionTabOptions = useMemo(
    () => ({
      title: 'Fuse',
      tabBarLabel: fusionUnlocked ? 'Fuse' : '',
      tabBarAccessibilityLabel: fusionUnlocked ? 'Fuse' : undefined,
      headerTitle: () => null,
      headerShown: fusionUnlocked && !immersiveSleep,
      headerStyle: {
        backgroundColor: mainScreens.fuse.bg,
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      tabBarIcon: ({
        focused,
        color,
        size,
      }: {
        focused: boolean;
        color: string;
        size: number;
      }) => renderTabIcon(TAB_ROUTE.FUSION, focused, color, size, !fusionUnlocked),
      tabBarButton: (props: StyledTabBarButtonProps) => (
        <View
          ref={fuseTabRef}
          collapsable={false}
          onLayout={updateFuseTabTapPos}
          style={styles.fuseTabMeasureWrap}
        >
          <StyledTabBarButton
            {...props}
            locked={!fusionUnlocked}
            disabled={gesturesLocked || !!props.disabled}
          />
        </View>
      ),
    }),
    [fusionUnlocked, gesturesLocked, immersiveSleep, updateFuseTabTapPos]
  );

  const collectionTabOptions = useMemo(
    () => ({
      title: 'Collection',
      tabBarLabel: collectionUnlocked ? 'Collection' : '',
      tabBarAccessibilityLabel: collectionUnlocked ? 'Collection' : undefined,
      headerShown: false,
      lazy: false,
      tabBarIcon: ({
        focused,
        color,
        size,
      }: {
        focused: boolean;
        color: string;
        size: number;
      }) =>
        renderTabIcon(TAB_ROUTE.COLLECTION, focused, color, size, !collectionUnlocked),
      tabBarButton: (props: StyledTabBarButtonProps) => (
        <StyledTabBarButton
          {...props}
          locked={!collectionUnlocked}
          disabled={gesturesLocked || !!props.disabled}
        />
      ),
    }),
    [collectionUnlocked, gesturesLocked]
  );

  return (
    <View ref={layoutRootRef} style={styles.layoutRoot}>
      <Tabs
      screenOptions={({ route }) => {
        const showSharedCandyPill =
          !immersiveSleep &&
          route.name !== TAB_ROUTE.SLEEP &&
          !(route.name === TAB_ROUTE.FUSION && !fusionUnlocked);
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
      <Tabs.Screen name={TAB_ROUTE.FUSION} options={fusionTabOptions} />
      <Tabs.Screen
        name={TAB_ROUTE.SLEEP}
        options={{
          title: 'Sleep',
          tabBarLabel: 'Sleep',
          header: () => <SleepTabHeader />,
        }}
      />
      <Tabs.Screen name={TAB_ROUTE.COLLECTION} options={collectionTabOptions} />
    </Tabs>

      {showTabBarCollectScrim ? <TabBarCollectScrimOverlay /> : null}

      {gesturesLocked ? (
        <View
          style={styles.gestureBlocker}
          pointerEvents="auto"
          accessibilityLabel="Animation in progress"
        />
      ) : null}

      <TutorialNpcDialogue
        visible={showFuseUnlockTutorial && !fuseUnlockComplete}
        message={TUTORIAL_COPY.fuseUnlock}
        onDismiss={() => {
          setShowFuseUnlockTutorial(false);
          completeTutorialStep('fuse_unlock');
        }}
      />

      <TutorialTapPrompt
        visible={showFuseTabTapPrompt}
        label={TUTORIAL_TAP.fuseTab}
        labelPosition="above"
        targetRect={fuseTabTapRect ?? undefined}
        style={fuseTabTapRect ? undefined : styles.fuseTabTapPromptFallback}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layoutRoot: {
    flex: 1,
    position: 'relative',
  },
  fuseTabMeasureWrap: {
    flex: 1,
    alignSelf: 'stretch',
  },
  fuseTabTapPromptFallback: {
    bottom: 120,
    left: 24,
    right: undefined,
    alignItems: 'flex-start',
  },
  gestureBlocker: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  tabBarScrimOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  tabScene: {
    flex: 1,
  },
  tabBarBackgroundFill: {
    backgroundColor: tabBarTheme.containerBg,
  },
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
  tabBarHidden: {
    height: 0,
    minHeight: 0,
    overflow: 'hidden',
    opacity: 0,
    borderTopWidth: 0,
    paddingTop: 0,
    paddingBottom: 0,
    elevation: 0,
  },
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
  tabButtonLocked: {
    opacity: 1,
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
  lockedTabInnerSlot: {
    width: 28,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
  },
});
