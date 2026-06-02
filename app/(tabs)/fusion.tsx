/**
 * Fusion screen — PRD: combine 2 slimes → 1, candy cost by tier.
 * Recipe + fuse logic lives in `src/services/fusion.ts`.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, Image, useWindowDimensions } from 'react-native';
import { useCollectionStore, useCandiesStore } from '@/src/stores';
import { getSpecies, getSlimes } from '@/src/db';
import type { SlimeVariant } from '@/src/constants/game';
import type { FusionRule, Species, Slime } from '@/src/types';
import {
  fetchRulesForParentPair,
  getFusionCandyCost,
  performFusion,
} from '@/src/services/fusion';
import { getSlimeDisplayName } from '@/src/utils/slimeDisplayName';
import { buildFusionPickerRows } from '@/src/utils/fusionPickerRows';
import {
  FusionFuseCtaLabel,
  FusionSlimePickerModal,
  FusionSlot,
  FusionResultModal,
} from '@/src/components';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const FUSE_QUESTION = require('../../assets/ui/fuse-question-element.png');

type Slot = 'a' | 'b';

export default function FusionScreen() {
  const { width: winW } = useWindowDimensions();
  const slimes = useCollectionStore((s) => s.slimes);
  const removeSlime = useCollectionStore((s) => s.removeSlime);
  const addSlime = useCollectionStore((s) => s.addSlime);
  const candies = useCandiesStore((s) => s.total);
  const spend = useCandiesStore((s) => s.spend);

  const [species, setSpecies] = useState<Species[]>([]);
  const [slotASlimeId, setSlotASlimeId] = useState<string | null>(null);
  const [slotBSlimeId, setSlotBSlimeId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<Slot>('a');
  const [isFusing, setIsFusing] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [resultSpecies, setResultSpecies] = useState<Species | null>(null);
  const [resultVariant, setResultVariant] = useState<SlimeVariant | undefined>(undefined);
  const [showFavorited, setShowFavorited] = useState(false);

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

  const cost = useMemo(
    () => (rulesForPair ? getFusionCandyCost(rulesForPair) : 0),
    [rulesForPair]
  );

  const canFuse =
    !!slimeA && !!slimeB && (rulesForPair?.length ?? 0) > 0 && !isFusing;
  const fuseDisabled = !canFuse || candies < cost;

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

  const handleFuse = async () => {
    if (!slimeA || !slimeB || !slotASlimeId || !slotBSlimeId) return;
    if (!rulesForPair || rulesForPair.length === 0) return;

    if (candies < cost) {
      Alert.alert('Not enough candies', `Need ${cost} candies to fuse.`);
      return;
    }

    setIsFusing(true);
    try {
      const ok = spend(cost);
      if (!ok) {
        Alert.alert('Not enough candies', `Need ${cost} candies to fuse.`);
        return;
      }

      const outcome = await performFusion({
        rulesForPair,
        ownedSlimes: slimes,
        slotASlimeId,
        slotBSlimeId,
        speciesById,
      });

      if (!outcome.ok) {
        Alert.alert('Fusion failed', outcome.message ?? 'Could not complete fusion.');
        return;
      }

      const [idA, idB] = outcome.consumedSlimeIds;
      removeSlime(idA);
      removeSlime(idB);
      addSlime(outcome.newSlime);

      setResultSpecies(outcome.resultSpecies);
      setResultVariant(outcome.newSlime.variant);
      setResultVisible(true);
      setSlotASlimeId(null);
      setSlotBSlimeId(null);
    } catch (e) {
      console.warn('Fusion failed', e);
      Alert.alert('Fusion failed', 'Something went wrong while fusing.');
    } finally {
      setIsFusing(false);
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
          <Text style={styles.costValue}>
            {cost} 🍬
          </Text>
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

      <FusionResultModal
        visible={resultVisible}
        onDismiss={() => {
          setResultVisible(false);
          setResultVariant(undefined);
        }}
        resultSpecies={resultSpecies}
        resultVariant={resultVariant}
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
