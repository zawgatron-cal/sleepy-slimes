/**
 * Fusion screen — PRD: combine 2 slimes → 1, candy cost by tier.
 * Recipe + fuse logic lives in `src/services/fusion.ts`.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, Image, useWindowDimensions } from 'react-native';
import { useCollectionStore, useCandiesStore } from '@/src/stores';
import { getSpecies, getSlimes } from '@/src/db';
import type { FusionRule, Species } from '@/src/types';
import {
  fetchRulesForParentPair,
  getFusionCandyCost,
  performFusion,
} from '@/src/services/fusion';
import {
  FusionFuseCtaLabel,
  FusionSlimePickerModal,
  FusionSlot,
  FusionResultModal,
  type FusionPickerRow,
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
  const [slotASpeciesId, setSlotASpeciesId] = useState<string | null>(null);
  const [slotBSpeciesId, setSlotBSpeciesId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<Slot>('a');
  const [isFusing, setIsFusing] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [resultSpecies, setResultSpecies] = useState<Species | null>(null);

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

  const countsBySpecies = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of slimes) {
      counts[s.speciesId] = (counts[s.speciesId] ?? 0) + 1;
    }
    return counts;
  }, [slimes]);

  const speciesA = slotASpeciesId ? speciesById[slotASpeciesId] : undefined;
  const speciesB = slotBSpeciesId ? speciesById[slotBSpeciesId] : undefined;

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
    !!speciesA && !!speciesB && (rulesForPair?.length ?? 0) > 0 && !isFusing;
  const fuseDisabled = !canFuse || candies < cost;

  const openPicker = (slot: Slot) => {
    setActiveSlot(slot);
    setPickerVisible(true);
  };

  const pickForSlot = (speciesId: string) => {
    if (activeSlot === 'a') setSlotASpeciesId(speciesId);
    else setSlotBSpeciesId(speciesId);
    setPickerVisible(false);
  };

  const availableSpecies = useMemo(() => {
    const counts: Record<string, number> = { ...countsBySpecies };
    if (activeSlot === 'a' && slotBSpeciesId) {
      counts[slotBSpeciesId] = (counts[slotBSpeciesId] ?? 0) - 1;
    }
    if (activeSlot === 'b' && slotASpeciesId) {
      counts[slotASpeciesId] = (counts[slotASpeciesId] ?? 0) - 1;
    }
    return Object.keys(counts)
      .map((id) => ({ species: speciesById[id], count: counts[id] ?? 0 }))
      .filter((entry) => entry.species && entry.count > 0)
      .sort((a, b) => {
        const ta = a.species!.tier;
        const tb = b.species!.tier;
        if (ta !== tb) return ta - tb;
        return a.species!.name.localeCompare(b.species!.name);
      });
  }, [countsBySpecies, activeSlot, slotASpeciesId, slotBSpeciesId, speciesById]);

  const fusionPickerRows = useMemo((): FusionPickerRow[] => {
    return availableSpecies
      .filter((e): e is { species: Species; count: number } => !!e.species && e.count > 0)
      .map((e) => ({ species: e.species, count: e.count }));
  }, [availableSpecies]);

  const handleFuse = async () => {
    if (!speciesA || !speciesB || !slotASpeciesId || !slotBSpeciesId) return;
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
        slotASpeciesId,
        slotBSpeciesId,
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
      setResultVisible(true);
      setSlotASpeciesId(null);
      setSlotBSpeciesId(null);
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
          <FusionSlot species={speciesA} onPress={() => openPicker('a')} />
          <FusionSlot species={speciesB} onPress={() => openPicker('b')} />
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

        {!speciesA || !speciesB ? (
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
        onPickSpecies={pickForSlot}
      />

      <FusionResultModal
        visible={resultVisible}
        onDismiss={() => setResultVisible(false)}
        resultSpecies={resultSpecies}
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
