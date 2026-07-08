/**
 * Fusion screen — PRD: combine 2 slimes → 1, candy cost by tier.
 * Recipe + fuse logic lives in `src/services/fusion.ts`.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, Image, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCollectionStore, useCandiesStore, useEquippedSlimeStore, useTutorialCompletedSteps, useTutorialStepComplete, useTutorialStore } from '@/src/stores';
import { TUTORIAL_COPY } from '@/src/constants/tutorial';
import { findTutorialFusionPair } from '@/src/utils/tutorialFusionPair';
import { getSlimepediaDiscoveredSpeciesIds, getSpecies, getSlimes } from '@/src/db';
import type { SlimeVariant } from '@/src/constants/game';
import type { FusionRule, Species, Slime } from '@/src/types';
import {
  fetchRulesForParentPair,
  getFusionCandyCost,
  performFusion,
} from '@/src/services/fusion';
import {
  applyEquippedFusionCandyDiscount,
  EMPTY_EQUIPPED_SLIME_BONUS,
  getEquippedSlimeBonus,
} from '@/src/utils/equippedSlimeRewards';
import { getSlimeDisplayName } from '@/src/utils/slimeDisplayName';
import { buildFusionConfirmationMessage } from '@/src/utils/fusionConsumption';
import { buildFusionPickerRows } from '@/src/utils/fusionPickerRows';
import { isDreamerFusionUnlocked } from '@/src/utils/dreamerFusionUnlock';
import {
  FusionFuseCtaLabel,
  FusionSlimePickerModal,
  FusionSlot,
  FusionRevealOverlay,
  TutorialNpcDialogue,
  CandyGlyph,
} from '@/src/components';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { isFusionTabUnlocked } from '@/src/utils/tutorialTabUnlock';
import { navigateToCollectionWithReveal } from '@/src/utils/collectionRevealTransition';

const FUSE_QUESTION = require('../../assets/ui/fuse-question-element.png');

type Slot = 'a' | 'b';

type FusionRevealSession = {
  parentSpeciesAId: string;
  parentSpeciesBId: string;
  resultSpecies: Species;
  resultVariant?: SlimeVariant;
  isNewSpecies: boolean;
  newSlimeId: string;
};

function confirmFusionAction(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert('Fuse this slime?', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Fuse', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export default function FusionScreen() {
  const router = useRouter();
  const { width: winW } = useWindowDimensions();
  const slimes = useCollectionStore((s) => s.slimes);
  const removeSlime = useCollectionStore((s) => s.removeSlime);
  const addSlime = useCollectionStore((s) => s.addSlime);
  const candies = useCandiesStore((s) => s.total);
  const spend = useCandiesStore((s) => s.spend);
  const refundCandies = useCandiesStore((s) => s.add);
  const equippedSlimeId = useEquippedSlimeStore((s) => s.equippedSlimeId);

  const [species, setSpecies] = useState<Species[]>([]);
  const [slotASlimeId, setSlotASlimeId] = useState<string | null>(null);
  const [slotBSlimeId, setSlotBSlimeId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<Slot>('a');
  const [isFusing, setIsFusing] = useState(false);
  const [revealSession, setRevealSession] = useState<FusionRevealSession | null>(null);
  const [revealKey, setRevealKey] = useState(0);
  const [showFavorited, setShowFavorited] = useState(false);
  const [dreamerFusionUnlocked, setDreamerFusionUnlocked] = useState(false);
  const tutorialHydrated = useTutorialStore((s) => s.hydrated);
  const completedSteps = useTutorialCompletedSteps();
  const startSleepComplete = useTutorialStepComplete('start_sleep');
  const fuseUnlockComplete = useTutorialStepComplete('fuse_unlock');
  const fusionGuideComplete = useTutorialStepComplete('fusion_guide');
  const isOnboardingComplete = completedSteps.includes('fusion_guide');
  const completeTutorialStep = useTutorialStore((s) => s.completeStep);
  const fusionIntroSeen = useTutorialStore((s) => s.fusionIntroSeen);
  const markFusionIntroSeen = useTutorialStore((s) => s.markFusionIntroSeen);
  const markFuseTabOpened = useTutorialStore((s) => s.markFuseTabOpened);
  const fusionUnlocked = isFusionTabUnlocked({
    hydrated: tutorialHydrated,
    isStepComplete: (step) => completedSteps.includes(step),
    isOnboardingComplete,
    slimesCount: slimes.length,
  });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getSlimepediaDiscoveredSpeciesIds()
        .then((discovered) => {
          if (!cancelled) {
            setDreamerFusionUnlocked(isDreamerFusionUnlocked(discovered));
          }
        })
        .catch((e) => console.warn('Dreamer unlock check failed', e));
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    getSpecies().then(setSpecies).catch((e) => console.warn('getSpecies failed', e));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const dbSlimes = await getSlimes();
        if (!cancelled) {
          useCollectionStore.getState().setSlimes(dbSlimes);
        }
      } catch (e) {
        console.warn('Fusion load slimes failed', e);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const speciesById = useMemo(() => {
    const map: Record<string, Species> = {};
    for (const s of species) map[s.id] = s;
    return map;
  }, [species]);

  const equippedBonus = useMemo(() => {
    if (!equippedSlimeId) return EMPTY_EQUIPPED_SLIME_BONUS;
    const slime = slimes.find((s) => s.id === equippedSlimeId);
    const speciesRow = slime ? speciesById[slime.speciesId] : undefined;
    if (!slime || !speciesRow) return EMPTY_EQUIPPED_SLIME_BONUS;
    return getEquippedSlimeBonus(speciesRow.tier, slime.level);
  }, [equippedSlimeId, slimes, speciesById]);

  const slimeA = useMemo(
    () => (slotASlimeId ? slimes.find((s) => s.id === slotASlimeId) : undefined),
    [slimes, slotASlimeId]
  );
  const slimeB = useMemo(
    () => (slotBSlimeId ? slimes.find((s) => s.id === slotBSlimeId) : undefined),
    [slimes, slotBSlimeId]
  );

  const speciesA = slimeA ? speciesById[slimeA.speciesId] : undefined;
  const speciesB = slimeB ? speciesById[slimeB.speciesId] : undefined;

  const [rulesForPair, setRulesForPair] = useState<FusionRule[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!speciesA || !speciesB) {
      setRulesForPair(null);
      return;
    }
    setRulesForPair(null);
    fetchRulesForParentPair(speciesA.id, speciesB.id)
      .then((r) => {
        if (!cancelled) setRulesForPair(r);
      })
      .catch((e) => {
        console.warn('fetchRulesForParentPair failed', e);
        if (!cancelled) setRulesForPair([]);
      });
    return () => {
      cancelled = true;
    };
  }, [speciesA?.id, speciesB?.id]);

  const baseCost = useMemo(
    () => (rulesForPair ? getFusionCandyCost(rulesForPair) : 0),
    [rulesForPair]
  );
  const cost = useMemo(
    () => applyEquippedFusionCandyDiscount(baseCost, equippedBonus),
    [baseCost, equippedBonus]
  );

  const canFuse =
    !!slimeA && !!slimeB && (rulesForPair?.length ?? 0) > 0 && !isFusing && !revealSession;

  const openPicker = (slot: Slot) => {
    setActiveSlot(slot);
    setPickerVisible(true);
  };

  const pickForSlot = (slimeId: string) => {
    if (activeSlot === 'a') setSlotASlimeId(slimeId);
    else setSlotBSlimeId(slimeId);
    setPickerVisible(false);
  };

  const fusionPickerRows = useMemo(() => {
    const otherSlotId = activeSlot === 'a' ? slotBSlimeId : slotASlimeId;
    return buildFusionPickerRows(slimes, speciesById, otherSlotId, showFavorited);
  }, [slimes, speciesById, activeSlot, slotASlimeId, slotBSlimeId, showFavorited]);

  useEffect(() => {
    if (showFavorited) return;
    if (slimeA?.favorited) setSlotASlimeId(null);
    if (slimeB?.favorited) setSlotBSlimeId(null);
  }, [showFavorited, slimeA?.favorited, slimeB?.favorited]);

  const tutorialPair = useMemo(() => findTutorialFusionPair(slimes), [slimes]);

  const primeFusionTutorial = useCallback(() => {
    if (fusionGuideComplete) return;
    if (!tutorialPair) {
      completeTutorialStep('fusion_guide');
      return;
    }
    setSlotASlimeId(tutorialPair.slotASlimeId);
    setSlotBSlimeId(tutorialPair.slotBSlimeId);
  }, [tutorialPair, fusionGuideComplete, completeTutorialStep]);

  const showFusionIntro =
    tutorialHydrated &&
    fuseUnlockComplete &&
    !fusionGuideComplete &&
    !fusionIntroSeen &&
    !!tutorialPair;

  const fuseDisabled = !canFuse || candies < cost;

  useFocusEffect(
    useCallback(() => {
      markFuseTabOpened();
      if (!tutorialHydrated) return;
      if (!fusionUnlocked) return;
      if (!startSleepComplete) return;
      if (fusionGuideComplete) return;

      if (fuseUnlockComplete) {
        primeFusionTutorial();
      }
    }, [
      tutorialHydrated,
      fusionUnlocked,
      startSleepComplete,
      fusionGuideComplete,
      fuseUnlockComplete,
      primeFusionTutorial,
      markFuseTabOpened,
    ])
  );

  const runFusion = async () => {
    if (!slimeA || !slimeB || !slotASlimeId || !slotBSlimeId) return;
    if (!rulesForPair || rulesForPair.length === 0) return;

    if (candies < cost) {
      Alert.alert('Not enough candies', `Need ${cost} candies to fuse.`);
      return;
    }

    const fuseMessage = buildFusionConfirmationMessage([
      { slime: slimeA, species: speciesA },
      { slime: slimeB, species: speciesB },
    ]);
    if (fuseMessage && !(await confirmFusionAction(fuseMessage))) return;

    setIsFusing(true);
    const parentSpeciesAId = slimeA.speciesId;
    const parentSpeciesBId = slimeB.speciesId;
    let candySpent = false;
    try {
      const ok = spend(cost);
      if (!ok) {
        Alert.alert('Not enough candies', `Need ${cost} candies to fuse.`);
        return;
      }
      candySpent = true;

      const outcome = await performFusion({
        rulesForPair,
        ownedSlimes: slimes,
        slotASlimeId,
        slotBSlimeId,
        speciesById,
      });

      if (!outcome.ok) {
        refundCandies(cost);
        candySpent = false;
        Alert.alert('Fusion failed', outcome.message ?? 'Could not complete fusion.');
        return;
      }

      const [idA, idB] = outcome.consumedSlimeIds;
      const isNewSpecies = !slimes.some((s) => s.speciesId === outcome.resultSpecies.id);
      removeSlime(idA);
      removeSlime(idB);
      addSlime(outcome.newSlime);

      setRevealKey((key) => key + 1);
      setRevealSession({
        parentSpeciesAId,
        parentSpeciesBId,
        resultSpecies: outcome.resultSpecies,
        resultVariant: outcome.newSlime.variant,
        isNewSpecies,
        newSlimeId: outcome.newSlime.id,
      });
      setSlotASlimeId(null);
      setSlotBSlimeId(null);
    } catch (e) {
      console.warn('Fusion failed', e);
      if (candySpent) refundCandies(cost);
      Alert.alert('Fusion failed', 'Something went wrong while fusing.');
    } finally {
      setIsFusing(false);
    }
  };

  const handleFuse = () => {
    void runFusion();
  };

  const handleFusionIntroDismiss = () => {
    markFusionIntroSeen();
    completeTutorialStep('fusion_guide');
  };

  const handleFusionRevealDismiss = () => {
    const newSlimeId = revealSession?.newSlimeId;
    setRevealSession(null);
    if (newSlimeId) {
      navigateToCollectionWithReveal(router, [newSlimeId]);
    }
  };

  const questionWidth = Math.min(280, Math.round(winW * 0.72));

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Choose two slimes to fuse.</Text>

        <Image
          source={FUSE_QUESTION}
          style={[styles.questionGraphic, { width: questionWidth }]}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />

        <View style={styles.slotsRow}>
          <FusionSlot
            speciesId={slimeA?.speciesId}
            displayName={
              slimeA ? getSlimeDisplayName(slimeA, speciesA) : undefined
            }
            onPress={() => openPicker('a')}
          />
          <FusionSlot
            speciesId={slimeB?.speciesId}
            displayName={
              slimeB ? getSlimeDisplayName(slimeB, speciesB) : undefined
            }
            onPress={() => openPicker('b')}
          />
        </View>

        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Cost:</Text>
          <View style={styles.costValueRow}>
            <Text style={styles.costValue}>{cost}</Text>
            <CandyGlyph size={22} />
          </View>
        </View>

        <Pressable
          style={[styles.fuseButton, fuseDisabled && styles.fuseButtonDisabled]}
          onPress={handleFuse}
          disabled={fuseDisabled}
        >
          {isFusing ? (
            <Text style={styles.fuseButtonLoadingText}>Fusing…</Text>
          ) : (
            <FusionFuseCtaLabel muted={fuseDisabled} />
          )}
        </Pressable>

        {!slimeA || !slimeB ? (
          <Text style={styles.hint}>Tap the squares to pick two slimes.</Text>
        ) : rulesForPair === null ? (
          <Text style={styles.hint}>Checking recipe…</Text>
        ) : rulesForPair.length === 0 ? (
          <Text style={styles.hint}>No recipe for this pair.</Text>
        ) : candies < cost ? (
          <Text style={styles.hint}>Not enough candies.</Text>
        ) : null}
      </View>

      <FusionSlimePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        rows={fusionPickerRows}
        showFavorited={showFavorited}
        onShowFavoritedChange={setShowFavorited}
        onPickSlime={pickForSlot}
      />

      {revealSession ? (
        <FusionRevealOverlay
          revealKey={revealKey}
          parentSpeciesAId={revealSession.parentSpeciesAId}
          parentSpeciesBId={revealSession.parentSpeciesBId}
          resultSpecies={revealSession.resultSpecies}
          resultVariant={revealSession.resultVariant}
          isNewSpecies={revealSession.isNewSpecies}
          onDismiss={handleFusionRevealDismiss}
        />
      ) : null}

      {dreamerFusionUnlocked ? (
        <Pressable
          style={styles.dreamerUnlockButton}
          onPress={() => router.push('/dreamer-fusion')}
          accessibilityRole="button"
          accessibilityLabel="Slime Temple"
          accessibilityHint="Opens the Slime Temple fusion ritual"
        >
          <Text style={styles.dreamerUnlockButtonText}>?</Text>
        </Pressable>
      ) : null}

      <TutorialNpcDialogue
        visible={showFusionIntro}
        message={TUTORIAL_COPY.fusionIntro}
        onDismiss={handleFusionIntroDismiss}
      />
    </View>
  );
}

const styles = createAppStyles({
  container: {
    flex: 1,
    backgroundColor: mainScreens.fuse.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: mainScreens.fuse.slotSurface,
    textAlign: 'center',
    marginBottom: -4,
    paddingHorizontal: 8,
  },
  questionGraphic: {
    height: 160,
    marginBottom: -2,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 20,
    alignItems: 'stretch',
  },

  costRow: {
    width: '80%',
    maxWidth: 360,
    backgroundColor: mainScreens.fuse.surface,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginBottom: 18,
  },
  costLabel: { fontSize: 24, fontWeight: '800', color: mainScreens.fuse.primaryText },
  costValue: { fontSize: 24, fontWeight: '800', color: mainScreens.fuse.primaryText },
  costValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  fuseButton: {
    alignSelf: 'center',
    minWidth: 200,
    paddingVertical: 8,
    paddingHorizontal: 28,
    backgroundColor: mainScreens.fuse.primary,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: mainScreens.fuse.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuseButtonDisabled: {
    backgroundColor: mainScreens.fuse.disabledButtonBg,
    borderColor: mainScreens.fuse.disabledButtonBorder,
  },
  fuseButtonLoadingText: {
    fontSize: 20,
    fontWeight: '800',
    color: mainScreens.shared.onPrimary,
    paddingVertical: 6,
  },

  hint: { marginTop: 12, fontSize: 13, color: mainScreens.fuse.hintMuted, textAlign: 'center' },

  dreamerUnlockButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: mainScreens.fuse.primary,
    borderWidth: 5,
    borderColor: mainScreens.fuse.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  dreamerUnlockButtonText: {
    fontSize: 28,
    fontWeight: '800',
    color: mainScreens.shared.onPrimary,
    lineHeight: 30,
    marginTop: -2,
  },
});
