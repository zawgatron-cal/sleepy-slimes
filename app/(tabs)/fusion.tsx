/**
 * Fusion screen — PRD: combine 2 slimes → 1, candy cost by tier.
 * Implemented: pick two slimes, show cost, fuse using DB fusion rules, show result modal.
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, Image, useWindowDimensions } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { useCollectionStore, useCandiesStore } from '@/src/stores';
import { deleteSlime, getFusionResultsForParents, getSpecies, getSlimes, insertSlime } from '@/src/db';
import type { FusionRule, Slime, Species } from '@/src/types';
import { generateSlimeSeed, pickWeighted, randomShortId } from '@/src/utils/util';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import {
  FusionSlimePickerModal,
  FusionResultModal,
  type FusionPickerRow,
} from '@/src/components';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const FUSE_QUESTION = require('../../assets/ui/fuse-question-element.png');
const FUSE_SILHOUETTE = require('../../assets/ui/fuse-slime-sillhouette-element.png');

const FUSE_CTA_LABEL = 'Fuse';
const FUSE_CTA_FONT = 36;
const FUSE_CTA_HEIGHT = 48;
const FUSE_CTA_STROKE = 1.7;

function FusionFuseCtaLabel() {
  const [w, setW] = useState(168);
  const cx = w / 2;
  const baselineY = 36;

  return (
    <View
      style={styles.fuseCtaSvgWrap}
      onLayout={(e) => {
        const nextW = Math.floor(e.nativeEvent.layout.width);
        if (nextW > 0 && nextW !== w) setW(nextW);
      }}
    >
      <Svg width={w} height={FUSE_CTA_HEIGHT}>
        <SvgText
          x={cx}
          y={baselineY}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={FUSE_CTA_FONT}
          fontWeight="900"
          stroke={mainScreens.fuse.specialTextBorder}
          strokeWidth={FUSE_CTA_STROKE}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {FUSE_CTA_LABEL}
        </SvgText>
        <SvgText
          x={cx}
          y={baselineY}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={FUSE_CTA_FONT}
          fontWeight="900"
          fill={mainScreens.shared.onPrimary}
        >
          {FUSE_CTA_LABEL}
        </SvgText>
      </Svg>
    </View>
  );
}

type Slot = 'a' | 'b';

export default function FusionScreen() {
  const { width: winW } = useWindowDimensions();
  const slimes = useCollectionStore((s) => s.slimes);
  const removeSlime = useCollectionStore((s) => s.removeSlime);
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

  // Ensure collection store is hydrated even if user hasn't opened Collection tab yet.
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

  const [rules, setRules] = useState<FusionRule[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!speciesA || !speciesB) {
      setRules(null);
      return;
    }
    getFusionResultsForParents(speciesA.id, speciesB.id)
      .then((r) => {
        if (!cancelled) setRules(r);
      })
      .catch((e) => {
        console.warn('getFusionResultsForParents failed', e);
        if (!cancelled) setRules([]);
      });
    return () => {
      cancelled = true;
    };
  }, [speciesA?.id, speciesB?.id]);

  const cost = useMemo(() => {
    if (!rules || rules.length === 0) return 0;
    // Same cost for all rules for a given pair (by design).
    return rules[0]?.candyCost ?? 0;
  }, [rules]);

  const canFuse = !!speciesA && !!speciesB && (rules?.length ?? 0) > 0 && !isFusing;

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
    // Reserve one instance for the other slot's currently selected species.
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
    if (!rules || rules.length === 0) return;

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

      const deterministic = rules.filter((r) => r.deterministic);
      const chosen = deterministic.length > 0 ? deterministic[0] : pickWeighted(rules); // pick slime from fusionRule Table
      const result = speciesById[chosen.resultSpeciesId];
      if (!result) throw new Error(`Missing result species: ${chosen.resultSpeciesId}`);

      // Choose concrete slime instances to consume, honoring species selections.
      const pool = [...slimes];
      const slimeA = pool.find((s) => s.speciesId === slotASpeciesId);
      if (!slimeA) throw new Error('No slime instance for slot A');
      const idx = pool.findIndex((s) => s.id === slimeA.id);
      if (idx >= 0) pool.splice(idx, 1);
      const slimeB = pool.find((s) => s.speciesId === slotBSpeciesId);
      if (!slimeB) throw new Error('No slime instance for slot B');

      const newSlime: Slime = {
        id: `slime_${Date.now()}_${randomShortId()}`,
        speciesId: result.id,
        seed: generateSlimeSeed(),
        acquiredAt: Date.now(),
        source: 'fusion',
      };

      // Persist: remove parents, add result.
      await Promise.all([deleteSlime(slimeA.id), deleteSlime(slimeB.id), insertSlime(newSlime)]);

      // Update in-memory store.
      removeSlime(slimeA.id);
      removeSlime(slimeB.id);
      useCollectionStore.getState().addSlime(newSlime);

      setResultSpecies(result);
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
          <Pressable style={styles.slotBox} onPress={() => openPicker('a')}>
            {speciesA ? (
              <>
                <Image source={getSlimeImageSource(speciesA.id)} style={styles.slotImage} />
                <Text style={styles.slotName} numberOfLines={1}>
                  {speciesA.name}
                </Text>
              </>
            ) : (
              <Image
                source={FUSE_SILHOUETTE}
                style={styles.slotSilhouette}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            )}
          </Pressable>

          <Pressable style={styles.slotBox} onPress={() => openPicker('b')}>
            {speciesB ? (
              <>
                <Image source={getSlimeImageSource(speciesB.id)} style={styles.slotImage} />
                <Text style={styles.slotName} numberOfLines={1}>
                  {speciesB.name}
                </Text>
              </>
            ) : (
              <Image
                source={FUSE_SILHOUETTE}
                style={styles.slotSilhouette}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            )}
          </Pressable>
        </View>

        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Cost:</Text>
          <Text style={styles.costValue}>
            {cost} 🍬
          </Text>
        </View>

        <Pressable
          style={[styles.fuseButton, (!canFuse || candies < cost) && styles.fuseButtonDisabled]}
          onPress={handleFuse}
          disabled={!canFuse || candies < cost}
        >
          {isFusing ? (
            <Text style={styles.fuseButtonLoadingText}>Fusing…</Text>
          ) : (
            <FusionFuseCtaLabel />
          )}
        </Pressable>

        {!speciesA || !speciesB ? (
          <Text style={styles.hint}>Tap the squares to pick two slimes.</Text>
        ) : (rules?.length ?? 0) === 0 ? (
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
    marginBottom: 10,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 20,
    alignItems: 'stretch',
  },
  slotBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: 150,
    aspectRatio: 1,
    backgroundColor: mainScreens.fuse.slotSurface,
    borderRadius: 24,
    borderWidth: 10,
    borderColor: mainScreens.fuse.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  slotSilhouette: {
    width: '78%',
    height: '78%',
  },
  slotImage: { width: 56, height: 56, marginBottom: 6 },
  slotName: {
    fontSize: 12,
    fontWeight: '700',
    color: mainScreens.fuse.primaryText,
    maxWidth: '100%',
    textAlign: 'center',
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
    borderColor: mainScreens.fuse.borderOne,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuseButtonDisabled: { opacity: 0.45 },
  fuseCtaSvgWrap: {
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuseButtonLoadingText: {
    fontSize: 20,
    fontWeight: '800',
    color: mainScreens.shared.onPrimary,
    paddingVertical: 6,
  },

  hint: { marginTop: 12, fontSize: 13, color: mainScreens.fuse.primaryText, textAlign: 'center' },
});
