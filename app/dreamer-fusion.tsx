/**
 * Dreamer Slime — 4-parent legendary fusion screen.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCollectionStore, useCandiesStore, useEquippedSlimeStore } from '@/src/stores';
import { getSlimepediaDiscoveredSpeciesIds, getSpecies, getSlimes } from '@/src/db';
import type { SlimeVariant } from '@/src/constants/game';
import {
  DREAMER_FUSION_CANDY_COST,
  DREAMER_FUSION_PARENT_SLOTS,
  DREAMER_FUSION_PARENT_SPECIES_IDS,
  type DreamerFusionSlotIndex,
} from '@/src/constants/dreamerFusion';
import type { Species, Slime } from '@/src/types';
import { performDreamerFusion } from '@/src/services/dreamerFusion';
import {
  applyEquippedFusionCandyDiscount,
  EMPTY_EQUIPPED_SLIME_BONUS,
  getEquippedSlimeBonus,
} from '@/src/utils/equippedSlimeRewards';
import { isDreamerFusionUnlocked } from '@/src/utils/dreamerFusionUnlock';
import { navigateToCollectionWithReveal } from '@/src/utils/collectionRevealTransition';
import { isTutorialOnboardingLocked } from '@/src/utils/tutorialOnboardingLock';
import { getSlimeDisplayName } from '@/src/utils/slimeDisplayName';
import { buildFusionConfirmationMessage } from '@/src/utils/fusionConsumption';
import { buildFusionPickerRows } from '@/src/utils/fusionPickerRows';
import {
  FusionFuseCtaLabel,
  FusionSlimePickerModal,
  FusionSlot,
  FusionRevealOverlay,
} from '@/src/components';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

type FusionRevealSession = {
  parentSpeciesIds: [string, string, string, string];
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

function emptySlotIds(): [string | null, string | null, string | null, string | null] {
  return [null, null, null, null];
}

export default function DreamerFusionScreen() {
  const router = useRouter();
  const slimes = useCollectionStore((s) => s.slimes);
  const removeSlime = useCollectionStore((s) => s.removeSlime);
  const addSlime = useCollectionStore((s) => s.addSlime);
  const candies = useCandiesStore((s) => s.total);
  const spend = useCandiesStore((s) => s.spend);
  const refundCandies = useCandiesStore((s) => s.add);
  const equippedSlimeId = useEquippedSlimeStore((s) => s.equippedSlimeId);

  const [species, setSpecies] = useState<Species[]>([]);
  const [slotSlimeIds, setSlotSlimeIds] =
    useState<[string | null, string | null, string | null, string | null]>(emptySlotIds);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<DreamerFusionSlotIndex>(0);
  const [isFusing, setIsFusing] = useState(false);
  const [revealSession, setRevealSession] = useState<FusionRevealSession | null>(null);
  const [revealKey, setRevealKey] = useState(0);
  const [showFavorited, setShowFavorited] = useState(false);
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    getSpecies().then(setSpecies).catch((e) => console.warn('getSpecies failed', e));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        try {
          const [dbSlimes, discovered] = await Promise.all([
            getSlimes(),
            getSlimepediaDiscoveredSpeciesIds(),
          ]);
          if (cancelled) return;
          useCollectionStore.getState().setSlimes(dbSlimes);
          const isUnlocked = isDreamerFusionUnlocked(discovered);
          setUnlocked(isUnlocked);
          if (!isUnlocked || isTutorialOnboardingLocked()) {
            router.replace('/(tabs)/fusion');
          }
        } catch (e) {
          console.warn('Dreamer fusion load failed', e);
        }
      };
      load();
      return () => {
        cancelled = true;
      };
    }, [router])
  );

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

  const baseCost = DREAMER_FUSION_CANDY_COST;
  const cost = useMemo(
    () => applyEquippedFusionCandyDiscount(baseCost, equippedBonus),
    [baseCost, equippedBonus]
  );

  const slotSlimes = useMemo(
    () =>
      slotSlimeIds.map((id) => (id ? slimes.find((s) => s.id === id) : undefined)) as (
        | Slime
        | undefined
      )[],
    [slotSlimeIds, slimes]
  );

  const allSlotsFilled = slotSlimeIds.every((id) => id != null);
  const canFuse = allSlotsFilled && !isFusing && !revealSession;
  const fuseDisabled = !canFuse || candies < cost;

  const openPicker = (slot: DreamerFusionSlotIndex) => {
    setActiveSlot(slot);
    setPickerVisible(true);
  };

  const pickForSlot = (slimeId: string) => {
    setSlotSlimeIds((prev) => {
      const next = [...prev] as [string | null, string | null, string | null, string | null];
      next[activeSlot] = slimeId;
      return next;
    });
    setPickerVisible(false);
  };

  const requiredSpeciesId = DREAMER_FUSION_PARENT_SLOTS[activeSlot].speciesId;
  const excludeSlimeIds = useMemo(
    () => slotSlimeIds.filter((id, i) => i !== activeSlot && id != null) as string[],
    [slotSlimeIds, activeSlot]
  );

  const fusionPickerRows = useMemo(() => {
    const exclude = new Set(excludeSlimeIds);
    const eligible = slimes.filter(
      (s) => s.speciesId === requiredSpeciesId && !exclude.has(s.id)
    );
    return buildFusionPickerRows(eligible, speciesById, null, showFavorited);
  }, [slimes, speciesById, requiredSpeciesId, excludeSlimeIds, showFavorited]);

  useEffect(() => {
    if (showFavorited) return;
    setSlotSlimeIds((prev) => {
      let changed = false;
      const next = prev.map((id) => {
        if (!id) return id;
        const slime = slimes.find((s) => s.id === id);
        if (slime?.favorited) {
          changed = true;
          return null;
        }
        return id;
      }) as [string | null, string | null, string | null, string | null];
      return changed ? next : prev;
    });
  }, [showFavorited, slimes]);

  const handleFuse = async () => {
    if (!allSlotsFilled) return;
    const ids = slotSlimeIds as [string, string, string, string];

    if (candies < cost) {
      Alert.alert('Not enough candies', `Need ${cost} candies to fuse.`);
      return;
    }

    const fuseEntries = slotSlimes.map((slime, i) => ({
      slime: slime!,
      species: speciesById[DREAMER_FUSION_PARENT_SLOTS[i].speciesId],
    }));
    const fuseMessage = buildFusionConfirmationMessage(fuseEntries);
    if (fuseMessage && !(await confirmFusionAction(fuseMessage))) return;

    setIsFusing(true);
    let candySpent = false;
    try {
      const ok = spend(cost);
      if (!ok) {
        Alert.alert('Not enough candies', `Need ${cost} candies to fuse.`);
        return;
      }
      candySpent = true;

      const outcome = await performDreamerFusion({
        ownedSlimes: slimes,
        slotSlimeIds: ids,
        speciesById,
      });

      if (!outcome.ok) {
        refundCandies(cost);
        candySpent = false;
        Alert.alert('Fusion failed', outcome.message);
        return;
      }

      const isNewSpecies = !slimes.some((s) => s.speciesId === outcome.resultSpecies.id);
      for (const consumedId of outcome.consumedSlimeIds) {
        removeSlime(consumedId);
      }
      addSlime(outcome.newSlime);

      setRevealKey((key) => key + 1);
      setRevealSession({
        parentSpeciesIds: [...DREAMER_FUSION_PARENT_SPECIES_IDS] as [
          string,
          string,
          string,
          string,
        ],
        resultSpecies: outcome.resultSpecies,
        resultVariant: outcome.newSlime.variant,
        isNewSpecies,
        newSlimeId: outcome.newSlime.id,
      });
      setSlotSlimeIds(emptySlotIds());
    } catch (e) {
      console.warn('Dreamer fusion failed', e);
      if (candySpent) refundCandies(cost);
      Alert.alert('Fusion failed', 'Something went wrong while fusing.');
    } finally {
      setIsFusing(false);
    }
  };

  const handleFusionRevealDismiss = () => {
    const newSlimeId = revealSession?.newSlimeId;
    setRevealSession(null);
    if (newSlimeId) {
      navigateToCollectionWithReveal(router, [newSlimeId]);
    } else {
      router.back();
    }
  };

  if (unlocked === false || unlocked === null) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.title}>Temple of the Dreamer</Text>
        <Text style={styles.subtitle}>
          Four altars stand for each of the four zones. Offer one slime to each and the Dreamer may wake.
        </Text>

        <View style={styles.slotsRows}>
          <View style={styles.slotsRow}>
            {DREAMER_FUSION_PARENT_SLOTS.slice(0, 2).map((slot, index) => {
              const slime = slotSlimes[index];
              const speciesRow = speciesById[slot.speciesId];
              return (
                <FusionSlot
                  key={slot.speciesId}
                  speciesId={slime?.speciesId}
                  displayName={
                    slime ? getSlimeDisplayName(slime, speciesRow) : undefined
                  }
                  emptySilhouetteSpeciesId={slot.speciesId}
                  onPress={() => openPicker(index as DreamerFusionSlotIndex)}
                />
              );
            })}
          </View>
          <View style={styles.slotsRow}>
            {DREAMER_FUSION_PARENT_SLOTS.slice(2, 4).map((slot, offset) => {
              const index = offset + 2;
              const slime = slotSlimes[index];
              const speciesRow = speciesById[slot.speciesId];
              return (
                <FusionSlot
                  key={slot.speciesId}
                  speciesId={slime?.speciesId}
                  displayName={
                    slime ? getSlimeDisplayName(slime, speciesRow) : undefined
                  }
                  emptySilhouetteSpeciesId={slot.speciesId}
                  onPress={() => openPicker(index as DreamerFusionSlotIndex)}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Cost:</Text>
          <Text style={styles.costValue}>{cost} 🍬</Text>
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

        {!allSlotsFilled ? (
          <Text style={styles.hint}>Tap each altar to choose an offering.</Text>
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
          parentSpeciesAId={revealSession.parentSpeciesIds[0]}
          parentSpeciesBId={revealSession.parentSpeciesIds[1]}
          parentSpeciesIds={revealSession.parentSpeciesIds}
          resultSpecies={revealSession.resultSpecies}
          resultVariant={revealSession.resultVariant}
          isNewSpecies={revealSession.isNewSpecies}
          onDismiss={handleFusionRevealDismiss}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = createAppStyles({
  container: {
    flex: 1,
    backgroundColor: mainScreens.fuse.bg,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 4,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 18,
    fontWeight: '700',
    color: mainScreens.fuse.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: mainScreens.fuse.slotSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: mainScreens.fuse.hintMuted,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 16,
    maxWidth: 340,
    lineHeight: 22,
  },
  slotsRows: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 22,
    gap: 20,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 30,
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
});
