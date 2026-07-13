/**
 * Sleep screen — ui-one.pdf flow: idle → modal → tracking → summary → reveal(s).
 */

import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Asset } from 'expo-asset';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cancelAlarm, stopAlarmLoop } from '../../src/services/alarmNotifications';
import {
  useSleepStore,
  useCollectionStore,
  useCollectionRevealStore,
  useCandyCollectStore,
  useTutorialStepComplete,
  useTutorialStore,
  useZoneUnlockStore,
  areRevealAnimationsEnabled,
} from '@/src/stores';
import { TUTORIAL_COPY, TUTORIAL_TAP } from '@/src/constants/tutorial';
import { useSleepDataLoader, useSleepZoneViews, useTrackingPhaseUI, useSleepAlarm } from '@/src/hooks';
import { commitSleepRewards } from '@/src/services/sleepRewardCommit';
import { computeSleepRewards } from '@/src/services/sleepRewards';
import { clearActiveSleepSession, saveActiveSleepSession } from '@/src/services/activeSleepSession';
import { refreshSleepStreakFromDb } from '@/src/services/sleepStreakSync';
import { preloadCollectionForTransition } from '@/src/services/collectionPreload';
import { MIN_VALID_SLEEP_SECONDS, TIER_LABELS, Tier } from '@/src/constants/game';
import { sortSlimesByTierForReveal } from '@/src/utils/sleepScreen';
import { getSlimeImageSourcesForPreload } from '@/src/utils/slimeAssets';
import {
  SleepModal,
  SleepingTrackingPhase,
  SleepSummaryPhase,
  SleepRevealPhase,
  SleepCtaLabel,
  SleepIdleZoneArea,
  SleepIdleTopRow,
  MoreMenuModal,
  TutorialNpcDialogue,
  TutorialTapPrompt,
  ZoneUnlockModal,
  type TutorialTapTargetRect,
} from '@/src/components';
import { CandyCollectScrim } from '@/src/components/sleep/CandyCollectScrim';
import { SLEEP_TRACKING_LOGO, SLEEP_TRACKING_TILE } from '@/src/constants/sleepTrackingAssets';
import { SUMMARY_BACKGROUND_TILE } from '@/src/constants/summaryScreenAssets';
import { refreshZoneUnlockStore, unlockZone } from '@/src/services/zoneUnlock';
import { playUiSuccess, playUiTap } from '@/src/services/soundEffects';
import { alertError } from '@/src/utils/alertWithSound';
import { ZONES } from '@/src/data';
import type { SleepZoneView } from '@/src/utils/zoneUnlock';
import { GRASSY_MEADOW_WORLD } from '@/src/constants/sleepIdleAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

export default function SleepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    phase,
    selectedZoneId,
    sessionStartedAt,
    alarmAt,
    summaryCandies,
    summaryDurationHours,
    summarySlimes,
    slimesToReveal,
    revealIndex,
    newRevealSlimeIds,
    setSelectedZone,
    startSession,
    setSummaryRewards,
    startReveal,
    nextReveal,
    finishReveal,
    endSession,
  } = useSleepStore();

  const { speciesList, zones } = useSleepDataLoader();
  const { zoneViews, progress: zoneUnlockProgress } = useSleepZoneViews(zones);
  const { currentTime, trackingDots } = useTrackingPhaseUI(phase);
  useSleepAlarm(phase, alarmAt, currentTime);

  const [loading, setLoading] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [alarmDate, setAlarmDate] = useState<Date | null>(null);
  const [zoneSelectOpen, setZoneSelectOpen] = useState(false);
  const [zoneUnlockTarget, setZoneUnlockTarget] = useState<SleepZoneView | null>(null);
  const [zoneUnlocking, setZoneUnlocking] = useState(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [slimepediaTutorialPhase, setSlimepediaTutorialPhase] = useState<
    'dialogue' | 'menu' | 'menu_item'
  >('dialogue');
  const [menuTapRect, setMenuTapRect] = useState<TutorialTapTargetRect | null>(null);
  const [zoneTapRect, setZoneTapRect] = useState<TutorialTapTargetRect | null>(null);
  const layoutRootRef = useRef<View>(null);
  const menuButtonRef = useRef<ComponentRef<typeof Pressable>>(null);
  const zonePreviewRef = useRef<ComponentRef<typeof Pressable>>(null);
  const candyCollectVisible = useCandyCollectStore((s) => s.overlayVisible);
  const showCandyOverlay = useCandyCollectStore((s) => s.showOverlay);
  const setOnCandyOverlayComplete = useCandyCollectStore((s) => s.setOnOverlayComplete);
  const pendingCollectionSlimeIdsRef = useRef<string[]>([]);
  const slimes = useCollectionStore((s) => s.slimes);
  const tutorialHydrated = useTutorialStore((s) => s.hydrated);
  const welcomeComplete = useTutorialStepComplete('welcome');
  const zoneSelectComplete = useTutorialStepComplete('zone_select');
  const zoneUnlockGuideComplete = useTutorialStepComplete('zone_unlock_guide');
  const slimepediaGuideComplete = useTutorialStepComplete('slimepedia_guide');
  const zoneUnlockTutorialPending = useTutorialStore((s) => s.zoneUnlockTutorialPending);
  const zoneUnlockTutorialPhase = useTutorialStore((s) => s.zoneUnlockTutorialPhase);
  const setZoneUnlockTutorialPhase = useTutorialStore((s) => s.setZoneUnlockTutorialPhase);
  const completeTutorialStep = useTutorialStore((s) => s.completeStep);
  const clearZoneUnlockTutorialPending = useTutorialStore((s) => s.clearZoneUnlockTutorialPending);
  const markZoneUnlockTutorialPending = useTutorialStore((s) => s.markZoneUnlockTutorialPending);
  const ultraRareDiscoveryCount = useZoneUnlockStore((s) => s.ultraRareDiscoveryCount);

  const postUrTutorialChainActive =
    zoneUnlockTutorialPending ||
    (ultraRareDiscoveryCount >= 1 &&
      (!zoneUnlockGuideComplete || !slimepediaGuideComplete));

  useEffect(() => {
    if (!tutorialHydrated) return;
    if (zoneUnlockGuideComplete && slimepediaGuideComplete) return;
    if (ultraRareDiscoveryCount < 1 || zoneUnlockTutorialPending) return;
    markZoneUnlockTutorialPending();
  }, [
    tutorialHydrated,
    ultraRareDiscoveryCount,
    zoneUnlockGuideComplete,
    slimepediaGuideComplete,
    zoneUnlockTutorialPending,
    markZoneUnlockTutorialPending,
  ]);

  useEffect(() => {
    if (zoneUnlockGuideComplete && slimepediaGuideComplete && zoneUnlockTutorialPending) {
      clearZoneUnlockTutorialPending();
    }
  }, [
    zoneUnlockGuideComplete,
    slimepediaGuideComplete,
    zoneUnlockTutorialPending,
    clearZoneUnlockTutorialPending,
  ]);

  useEffect(() => {
    if (phase !== 'reveal') return;
    if (slimesToReveal.length === 0 || revealIndex >= slimesToReveal.length) {
      finishReveal();
    }
  }, [phase, slimesToReveal.length, revealIndex, finishReveal]);

  useFocusEffect(
    useCallback(() => {
      void refreshSleepStreakFromDb();
      void refreshZoneUnlockStore();

      const { phase, slimesToReveal, revealIndex } = useSleepStore.getState();
      if (
        phase === 'reveal' &&
        (slimesToReveal.length === 0 || revealIndex >= slimesToReveal.length)
      ) {
        finishReveal();
      }

      if (phase === 'idle' && !candyCollectVisible) {
        setZoneSelectOpen(false);
        setSleepModalVisible(false);
        setMoreMenuVisible(false);
      }
    }, [candyCollectVisible, finishReveal])
  );

  useEffect(() => {
    const selected = zoneViews.find((z) => z.id === selectedZoneId);
    if (selected?.unlocked) return;
    setSelectedZone(ZONES.GRASSY_MEADOW.id);
  }, [selectedZoneId, zoneViews, setSelectedZone]);

  const handlePressLockedZone = useCallback(
    (zone: SleepZoneView) => {
      setZoneUnlockTarget(zone);
      if (useTutorialStore.getState().zoneUnlockTutorialPhase === 'zone_select') {
        setZoneUnlockTutorialPhase('unlock_modal');
      }
    },
    [setZoneUnlockTutorialPhase]
  );

  const handleCloseZoneUnlockModal = useCallback(() => {
    setZoneUnlockTarget(null);
    if (useTutorialStore.getState().zoneUnlockTutorialPhase === 'unlock_modal') {
      setZoneUnlockTutorialPhase('zone_select');
    }
  }, [setZoneUnlockTutorialPhase]);

  const handleZoneUnlockTutorialDismiss = useCallback(() => {
    completeTutorialStep('zone_unlock_guide');
    clearZoneUnlockTutorialPending();
    setZoneUnlockTutorialPhase(null);
  }, [completeTutorialStep, clearZoneUnlockTutorialPending, setZoneUnlockTutorialPhase]);

  const handleUnlockZone = useCallback(async () => {
    if (!zoneUnlockTarget || zoneUnlocking) return;
    setZoneUnlocking(true);
    try {
      const result = await unlockZone(zoneUnlockTarget.id);
      if (!result.ok) {
        alertError('Cannot unlock zone', result.message);
        return;
      }
      playUiSuccess();
      setSelectedZone(zoneUnlockTarget.id);
      setZoneSelectOpen(false);
      setZoneUnlockTarget(null);
    } finally {
      setZoneUnlocking(false);
    }
  }, [zoneUnlockTarget, zoneUnlocking, setSelectedZone]);

  useEffect(() => {
    void Asset.loadAsync([
      SLEEP_TRACKING_TILE,
      SLEEP_TRACKING_LOGO,
      SUMMARY_BACKGROUND_TILE,
      GRASSY_MEADOW_WORLD,
    ]).catch((e) => {
      if (__DEV__) console.warn('Sleep UI asset preload failed', e);
    });
  }, []);

  useEffect(() => {
    if (!sleepModalVisible) return;
    void Asset.loadAsync([SLEEP_TRACKING_TILE, SLEEP_TRACKING_LOGO]).catch((e) => {
      if (__DEV__) console.warn('Sleep modal asset preload failed', e);
    });
  }, [sleepModalVisible]);

  useEffect(() => {
    if (summarySlimes.length === 0) return;
    const speciesIds = summarySlimes.map((s) => s.speciesId);
    void Asset.loadAsync(getSlimeImageSourcesForPreload(speciesIds)).catch((e) => {
      if (__DEV__) console.warn('Reveal slime art preload failed', e);
    });
  }, [summarySlimes]);

  const handleStopSleep = async () => {
    if (!sessionStartedAt) return;
    await cancelAlarm();
    stopAlarmLoop();
    const endedAt = Date.now();
    setLoading(true);
    try {
      const result = await computeSleepRewards(sessionStartedAt, endedAt, selectedZoneId);
      if (!result.valid) {
        alertError(
          'Too short',
          `Sleep at least ${MIN_VALID_SLEEP_SECONDS} seconds. You slept ${Math.floor(result.durationSeconds)}s.`
        );
        await clearActiveSleepSession();
        endSession();
        return;
      }
      sortSlimesByTierForReveal(result.slimes, speciesList);
      const ownedBefore = new Set(
        useCollectionStore.getState().slimes.map((s) => s.speciesId)
      );
      const newRevealSlimeIds: string[] = [];
      for (const slime of result.slimes) {
        if (!ownedBefore.has(slime.speciesId)) {
          newRevealSlimeIds.push(slime.id);
          ownedBefore.add(slime.speciesId);
        }
      }
      await commitSleepRewards(result);
      completeTutorialStep('start_sleep');
      await clearActiveSleepSession();
      setSummaryRewards(
        result.candies,
        result.slimes,
        result.session.durationHours,
        newRevealSlimeIds
      );
      playUiSuccess();
      void refreshSleepStreakFromDb();
      void refreshZoneUnlockStore();
    } catch (e) {
      console.warn('Sleep reward error:', e);
      alertError('Error', 'Could not save sleep session.');
      await clearActiveSleepSession();
      endSession();
    } finally {
      setLoading(false);
    }
  };

  const completeCollectionTransition = useCallback(() => {
    const ids = [...pendingCollectionSlimeIdsRef.current];
    pendingCollectionSlimeIdsRef.current = [];

    if (areRevealAnimationsEnabled() && ids.length > 0) {
      useCollectionRevealStore.getState().queueReveal(ids);
    }

    const navigate = () => router.navigate('/(tabs)/collection');
    if (areRevealAnimationsEnabled()) {
      setTimeout(navigate, 180);
      return;
    }

    void preloadCollectionForTransition().then(navigate).catch(() => navigate());
  }, [router]);

  const finishSleepAndGoToCollection = useCallback(() => {
    const { summaryCandies: candies, summarySlimes: slimes } = useSleepStore.getState();
    pendingCollectionSlimeIdsRef.current = [...slimes]
      .sort((a, b) => b.acquiredAt - a.acquiredAt)
      .map((s) => s.id);

    if (candies > 0) {
      showCandyOverlay(candies);
      finishReveal();
      return;
    }

    finishReveal();
    completeCollectionTransition();
  }, [completeCollectionTransition, finishReveal, showCandyOverlay]);

  useEffect(() => {
    setOnCandyOverlayComplete(completeCollectionTransition);
    return () => setOnCandyOverlayComplete(null);
  }, [completeCollectionTransition, setOnCandyOverlayComplete]);

  const handleSeeSlimes = () => {
    if (!areRevealAnimationsEnabled()) {
      if (summarySlimes.length === 0) {
        const candies = useSleepStore.getState().summaryCandies;
        if (candies > 0) {
          showCandyOverlay(candies);
        }
        finishReveal();
        return;
      }
      finishSleepAndGoToCollection();
      return;
    }

    if (summarySlimes.length === 0) {
      const candies = useSleepStore.getState().summaryCandies;
      if (candies > 0) {
        showCandyOverlay(candies);
      }
      finishReveal();
      return;
    }
    startReveal();
  };

  const handleGoToCollection = () => {
    finishSleepAndGoToCollection();
  };

  useEffect(() => {
    if (!candyCollectVisible) return;
    void preloadCollectionForTransition().catch((e) => {
      if (__DEV__) console.warn('Collection preload failed', e);
    });
  }, [candyCollectVisible]);

  const handleStartSleepFromModal = () => {
    const alarmMs = alarmDate ? alarmDate.getTime() : null;
    startSession(alarmMs);
    playUiSuccess();
    const startedAt = useSleepStore.getState().sessionStartedAt;
    if (startedAt != null) {
      void saveActiveSleepSession({
        startedAt,
        zoneId: selectedZoneId,
        alarmAt: alarmMs,
      }).catch((e) => console.warn('saveActiveSleepSession failed', e));
    }
    setSleepModalVisible(false);
  };

  const currentRevealSlime = slimesToReveal[revealIndex];
  const revealSpecies = currentRevealSlime
    ? speciesList.find((s) => s.id === currentRevealSlime.speciesId)
    : null;
  const isLastReveal = revealIndex >= slimesToReveal.length - 1;
  const revealTotal = slimesToReveal.length;
  const revealProgress = revealTotal > 0 ? `${revealIndex + 1}/${revealTotal}` : '0/0';

  const bottomInset = Math.max(insets.bottom, 8);
  const isIdle = phase === 'idle';
  const candyCollectActive = useCandyCollectStore((s) => s.active);

  const showWelcomeTutorial =
    tutorialHydrated &&
    isIdle &&
    !candyCollectVisible &&
    slimes.length === 0 &&
    !welcomeComplete;

  const showWelcomeZoneTapPrompt =
    tutorialHydrated &&
    isIdle &&
    welcomeComplete &&
    !zoneSelectComplete &&
    slimes.length === 0 &&
    !candyCollectVisible &&
    !showWelcomeTutorial &&
    !zoneSelectOpen &&
    !sleepModalVisible &&
    !moreMenuVisible &&
    zoneUnlockTarget == null;

  const slimepediaTutorialActive =
    tutorialHydrated &&
    isIdle &&
    !candyCollectVisible &&
    !showWelcomeTutorial &&
    !zoneSelectOpen &&
    !sleepModalVisible &&
    zoneUnlockTarget == null &&
    postUrTutorialChainActive &&
    !slimepediaGuideComplete;

  const zoneUnlockTutorialActive =
    tutorialHydrated &&
    slimepediaGuideComplete &&
    !zoneUnlockGuideComplete &&
    zoneUnlockTutorialPhase != null;

  const showPostUrZonePreviewTap =
    zoneUnlockTutorialActive &&
    isIdle &&
    !candyCollectVisible &&
    !showWelcomeTutorial &&
    !zoneSelectOpen &&
    !sleepModalVisible &&
    !moreMenuVisible &&
    zoneUnlockTarget == null &&
    zoneUnlockTutorialPhase === 'zone_preview';

  const lockedZoneTutorialActive =
    zoneUnlockTutorialActive && zoneSelectOpen && zoneUnlockTutorialPhase === 'zone_select';

  const showZoneUnlockModalTutorial =
    zoneUnlockTutorialPhase === 'unlock_modal' && zoneUnlockTarget != null;

  const showZoneTapPrompt = showWelcomeZoneTapPrompt || showPostUrZonePreviewTap;

  const activePostUrTutorial =
    tutorialHydrated &&
    isIdle &&
    !candyCollectVisible &&
    !showWelcomeTutorial &&
    !zoneSelectOpen &&
    !sleepModalVisible &&
    !moreMenuVisible &&
    zoneUnlockTarget == null &&
    slimepediaTutorialActive &&
    slimepediaTutorialPhase === 'dialogue'
      ? 'slimepedia'
      : null;

  const showSlimepediaMenuTapPrompt =
    slimepediaTutorialActive &&
    slimepediaTutorialPhase === 'menu' &&
    !moreMenuVisible;

  const showSlimepediaRowTapPrompt =
    slimepediaTutorialActive &&
    slimepediaTutorialPhase === 'menu_item' &&
    moreMenuVisible;

  const handleOpenZoneSelect = useCallback(() => {
    if (showWelcomeZoneTapPrompt) {
      completeTutorialStep('zone_select');
    }
    if (zoneUnlockTutorialPhase === 'zone_preview') {
      setZoneUnlockTutorialPhase('zone_select');
    }
    setZoneSelectOpen(true);
  }, [
    showWelcomeZoneTapPrompt,
    zoneUnlockTutorialPhase,
    completeTutorialStep,
    setZoneUnlockTutorialPhase,
  ]);

  const handleCloseZoneSelect = useCallback(() => {
    setZoneSelectOpen(false);
    if (zoneUnlockTutorialPhase === 'zone_select') {
      setZoneUnlockTutorialPhase('zone_preview');
    }
  }, [zoneUnlockTutorialPhase, setZoneUnlockTutorialPhase]);

  const updateZoneTapPos = useCallback(() => {
    if (!showZoneTapPrompt || !zonePreviewRef.current || !layoutRootRef.current) return;
    zonePreviewRef.current.measureLayout(
      layoutRootRef.current,
      (x, y, width, height) => {
        if (width > 0 && height > 0) {
          setZoneTapRect({ x, y, width, height });
        }
      },
      () => setZoneTapRect(null)
    );
  }, [showZoneTapPrompt]);

  useEffect(() => {
    if (!showZoneTapPrompt) {
      setZoneTapRect(null);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tryMeasure = () => {
      if (cancelled) return;
      if (!zonePreviewRef.current || !layoutRootRef.current) {
        if (attempts < 12) {
          attempts += 1;
          setTimeout(tryMeasure, 100);
        }
        return;
      }
      zonePreviewRef.current.measureLayout(
        layoutRootRef.current,
        (x, y, width, height) => {
          if (cancelled) return;
          if (width > 0 && height > 0) {
            setZoneTapRect({ x, y, width, height });
          }
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
  }, [showZoneTapPrompt]);

  const updateMenuTapPos = useCallback(() => {
    if (!showSlimepediaMenuTapPrompt || !menuButtonRef.current || !layoutRootRef.current) return;
    menuButtonRef.current.measureLayout(
      layoutRootRef.current,
      (x, y, width, height) => {
        if (width > 0 && height > 0) {
          setMenuTapRect({ x, y, width, height });
        }
      },
      () => setMenuTapRect(null)
    );
  }, [showSlimepediaMenuTapPrompt]);

  useEffect(() => {
    if (!showSlimepediaMenuTapPrompt) {
      setMenuTapRect(null);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tryMeasure = () => {
      if (cancelled) return;
      if (!menuButtonRef.current || !layoutRootRef.current) {
        if (attempts < 12) {
          attempts += 1;
          setTimeout(tryMeasure, 100);
        }
        return;
      }
      menuButtonRef.current.measureLayout(
        layoutRootRef.current,
        (x, y, width, height) => {
          if (cancelled) return;
          if (width > 0 && height > 0) {
            setMenuTapRect({ x, y, width, height });
          }
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
  }, [showSlimepediaMenuTapPrompt]);

  useEffect(() => {
    if (!slimepediaTutorialActive) {
      setSlimepediaTutorialPhase('dialogue');
    }
  }, [slimepediaTutorialActive]);

  const handleOpenMoreMenu = useCallback(() => {
    setMoreMenuVisible(true);
    if (slimepediaTutorialActive && slimepediaTutorialPhase === 'menu') {
      setSlimepediaTutorialPhase('menu_item');
    }
  }, [slimepediaTutorialActive, slimepediaTutorialPhase]);

  const handleCloseMoreMenu = useCallback(() => {
    setMoreMenuVisible(false);
    if (slimepediaTutorialActive && slimepediaTutorialPhase === 'menu_item') {
      setSlimepediaTutorialPhase('menu');
    }
  }, [slimepediaTutorialActive, slimepediaTutorialPhase]);

  const handleOpenSlimepedia = useCallback(() => {
    if (slimepediaTutorialActive) {
      completeTutorialStep('slimepedia_guide');
      setZoneUnlockTutorialPhase('slimepedia_back');
      setSlimepediaTutorialPhase('dialogue');
    }
    setMoreMenuVisible(false);
    router.push('/slimepedia');
  }, [
    slimepediaTutorialActive,
    completeTutorialStep,
    setZoneUnlockTutorialPhase,
    router,
  ]);

  return (
    <>
      <View ref={layoutRootRef} style={styles.layoutRoot} collapsable={false}>
        <View style={styles.screen} onLayout={() => {
          updateMenuTapPos();
          updateZoneTapPos();
        }}>
        <View
          style={[styles.idleContent, !isIdle && styles.idleContentHidden]}
          pointerEvents={isIdle ? 'auto' : 'none'}
        >
          <SleepIdleZoneArea
            bottomInset={bottomInset}
            zoneSelectOpen={zoneSelectOpen}
            zones={zoneViews}
            selectedZoneId={selectedZoneId}
            zonePreviewRef={zonePreviewRef}
            onOpenZoneSelect={handleOpenZoneSelect}
            onCloseZoneSelect={handleCloseZoneSelect}
            onSelectZone={(zoneId) => {
              setSelectedZone(zoneId);
              setZoneSelectOpen(false);
            }}
            onPressLockedZone={handlePressLockedZone}
            lockedZoneTutorialActive={lockedZoneTutorialActive}
            renderTopRow={() => (
              <SleepIdleTopRow
                menuButtonRef={menuButtonRef}
                onPressSleepData={() => router.push('/sleep-data')}
                onPressMenu={handleOpenMoreMenu}
              />
            )}
            renderFooter={() => (
              <View style={styles.idleFooter}>
                <Pressable
                  style={styles.heroSleep}
                  onPress={() => {
                    playUiTap();
                    setSleepModalVisible(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Start sleep"
                  disabled={candyCollectVisible}
                >
                  <SleepCtaLabel />
                </Pressable>

                {__DEV__ && (
                  <Link href="/dev" asChild style={styles.devLink}>
                    <Pressable disabled={candyCollectVisible}>
                      <Text style={styles.devLinkText}>Dev — View SQLite</Text>
                    </Pressable>
                  </Link>
                )}
              </View>
            )}
          />
        </View>

        {!isIdle ? (
          <View style={styles.activePhaseLayer} pointerEvents="box-none">
            {phase === 'tracking' ? (
              <SleepingTrackingPhase
                currentTime={currentTime}
                trackingDots={trackingDots}
                alarmAt={alarmAt}
                loading={loading}
                bottomPad={bottomInset}
                onStop={handleStopSleep}
              />
            ) : null}

            {phase === 'summary' ? (
              <SleepSummaryPhase
                durationHours={summaryDurationHours}
                candies={summaryCandies}
                slimeCount={summarySlimes.length}
                onSeeSlimes={handleSeeSlimes}
              />
            ) : null}

            {phase === 'reveal' && currentRevealSlime ? (
              <SleepRevealPhase
                revealKey={revealIndex}
                revealProgress={revealProgress}
                speciesName={revealSpecies?.name ?? 'Unknown slime'}
                tier={revealSpecies?.tier ?? Tier.COMMON}
                tierLabel={
                  revealSpecies
                    ? TIER_LABELS[revealSpecies.tier]
                    : 'Unknown'
                }
                speciesId={currentRevealSlime.speciesId}
                slimeVariant={currentRevealSlime.variant}
                isNewSpecies={newRevealSlimeIds.includes(currentRevealSlime.id)}
                ctaLabel={isLastReveal ? 'Go to collection' : 'Continue'}
                onPressCta={isLastReveal ? handleGoToCollection : nextReveal}
              />
            ) : null}
          </View>
        ) : null}

        {candyCollectActive ? (
          <CandyCollectScrim style={styles.candyCollectBodyScrim} />
        ) : null}
        </View>

        <View style={styles.tutorialTapLayer} pointerEvents="box-none">
          <TutorialTapPrompt
            visible={showZoneTapPrompt}
            label={TUTORIAL_TAP.zone}
            targetRect={zoneTapRect ?? undefined}
            handSize={22}
            labelMinWidth={132}
            style={zoneTapRect ? undefined : styles.zoneTapPromptFallback}
          />
          <TutorialTapPrompt
            visible={showSlimepediaMenuTapPrompt}
            label={TUTORIAL_TAP.moreMenu}
            targetRect={menuTapRect ?? undefined}
            handSize={22}
            labelMinWidth={108}
            style={menuTapRect ? undefined : styles.menuTapPromptFallback}
          />
        </View>
      </View>

      {showWelcomeTutorial ? (
        <TutorialNpcDialogue
          visible
          message={TUTORIAL_COPY.welcome}
          onDismiss={() => {
            completeTutorialStep('welcome');
          }}
        />
      ) : null}

      {activePostUrTutorial ? (
        <TutorialNpcDialogue
          visible
          message={TUTORIAL_COPY.slimepediaGuide}
          onDismiss={() => {
            setSlimepediaTutorialPhase('menu');
          }}
        />
      ) : null}

      <ZoneUnlockModal
        visible={zoneUnlockTarget != null}
        zone={zoneUnlockTarget}
        candies={zoneUnlockProgress.candies}
        unlocking={zoneUnlocking}
        zoneUnlockTutorialMessage={
          showZoneUnlockModalTutorial ? TUTORIAL_COPY.zoneUnlockModal : undefined
        }
        onZoneUnlockTutorialDismiss={
          showZoneUnlockModalTutorial ? handleZoneUnlockTutorialDismiss : undefined
        }
        onClose={handleCloseZoneUnlockModal}
        onUnlock={() => void handleUnlockZone()}
      />

      <SleepModal
        visible={sleepModalVisible}
        alarmDate={alarmDate}
        onAlarmDateChange={setAlarmDate}
        onClose={() => setSleepModalVisible(false)}
        onConfirm={handleStartSleepFromModal}
      />

      <MoreMenuModal
        visible={moreMenuVisible}
        showDev={__DEV__}
        slimepediaTutorialTap={showSlimepediaRowTapPrompt}
        onClose={handleCloseMoreMenu}
        onSlimepedia={handleOpenSlimepedia}
        onSettings={() => {
          handleCloseMoreMenu();
          router.push('/settings');
        }}
        onDev={
          __DEV__
            ? () => {
                handleCloseMoreMenu();
                router.push('/dev');
              }
            : undefined
        }
      />
    </>
  );
}

const styles = createAppStyles({
  layoutRoot: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  screen: {
    flex: 1,
    minHeight: 0,
    backgroundColor: mainScreens.idle.bg,
    position: 'relative',
    overflow: 'visible',
  },
  idleContentHidden: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0,
    zIndex: 0,
  },
  activePhaseLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  candyCollectBodyScrim: {
    zIndex: 10,
  },
  idleContent: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  idleFooter: {
    flexShrink: 0,
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
  zoneSelectContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 100,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  zoneSelectHeader: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  zoneSelectTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    textAlign: 'center',
  },
  zoneSelectScroll: {
    width: '100%',
  },
  zoneSelectScroller: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    gap: 14,
  },
  zoneSelectCard: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  zoneSelectCardSelected: {
    opacity: 0.88,
  },
  zoneSelectImage: {
    width: '100%',
    backgroundColor: mainScreens.idle.bg,
    borderRadius: 12,
    marginBottom: 8,
  },
  zoneSelectCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    marginBottom: 2,
    textAlign: 'center',
  },
  zoneSelectCardEffect: {
    fontSize: 12,
    color: mainScreens.idle.border,
    lineHeight: 16,
    textAlign: 'center',
  },
  sleepDataPill: {
    minHeight: 50,
    minWidth: 120,
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginLeft: -10,
    borderRadius: 12,
    backgroundColor: mainScreens.idle.surface,
    borderWidth: 4,
    borderColor: mainScreens.idle.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepDataSvgWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCircle: {
    width: 50,
    height: 50,
    marginRight: -6,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: mainScreens.idle.border,
    backgroundColor: mainScreens.idle.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBars: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuBar: {
    width: 24,
    height: 3,
    borderRadius: 1,
    backgroundColor: mainScreens.idle.menuIcon,
  },
  menuBarMid: {
    width: 14,
  },
  zoneSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  zoneImageCard: {
    alignSelf: 'stretch',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  zoneImageCardLocked: {
    opacity: 0.5,
  },
  zoneImage: {
    width: '100%',
    height: '100%',
    backgroundColor: mainScreens.idle.bg,
  },
  zoneCaption: {
    fontSize: 18,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    marginBottom: 4,
    flexShrink: 0,
  },
  zoneEffectLine: {
    fontSize: 13,
    color: mainScreens.idle.border,
    marginBottom: 0,
    lineHeight: 18,
    flexShrink: 0,
  },
  heroSleep: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: mainScreens.idle.surface,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: mainScreens.idle.border,
  },
  sleepCtaSvgWrap: {
    minWidth: 168,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devLink: { marginTop: 8, alignSelf: 'center' },
  devLinkText: { fontSize: 12, color: mainScreens.idle.mutedText },
  tutorialTapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    overflow: 'visible',
  },
  menuTapPromptFallback: {
    top: 52,
    right: 28,
    left: undefined,
    alignItems: 'flex-end',
  },
  zoneTapPromptFallback: {
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  centeredPhase: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryCta: {
    backgroundColor: mainScreens.idle.primary,
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryCtaText: {
    color: mainScreens.shared.onPrimary,
    fontSize: 17,
    fontWeight: '700',
  },

});
