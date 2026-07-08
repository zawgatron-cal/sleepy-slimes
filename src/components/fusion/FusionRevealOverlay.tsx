/**
 * Fusion reveal — parent merge, optional silhouette bounce, result pop-in.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { SlimeArtwork } from '@/src/components/SlimeArtwork';
import { FitText } from '@/src/components/FitText';
import { SlimeSilhouetteArtwork } from '@/src/components/SlimeSilhouetteArtwork';
import { NewBadgeSparkleBurst } from '@/src/components/sleep/NewBadgeSparkleBurst';
import { VariantSilhouetteStarFlash } from '@/src/components/sleep/VariantSilhouetteStarFlash';
import {
  FUSION_BOUNCE_MS,
  FUSION_CTA_DELAY_MS,
  FUSION_HANDOFF_MS,
  FUSION_META_MS,
  FUSION_SILHOUETTE_HANDOFF_START_RATIO,
  FUSION_NEW_BADGE_DELAY_MS,
  FUSION_NEW_BADGE_FADE_MS,
  resolveFusionFlashPeak,
  resolveFusionSilhouetteRevealMs,
  resolveFusionVariantAnticipationMs,
  resolveFusionMergeMs,
  resolveFusionSwirlMs,
  buildFusionParentSwirlPath,
  buildFusionFourParentOrbitPath,
  shouldShowFusionRevealVariant,
  usesFusionSilhouetteAnticipation,
  usesFusionVariantSilhouetteTease,
  resolveFusionFourParentSwirlMs,
} from '@/src/constants/fusionReveal';
import {
  resolveVariantRevealLevel,
  VARIANT_REVEAL_CTA_EXTRA_DELAY_MS,
  VARIANT_STAR_PULSE_MS,
  VARIANT_STAR_TEASE_FINISH_BEAT_MS,
  VARIANT_STAR_TEASE_MS,
} from '@/src/constants/sleepVariantReveal';
import { SLIME_VARIANT_LABELS, TIER_LABELS, type SlimeVariant, type Tier as TierType } from '@/src/constants/game';
import type { Species } from '@/src/types';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { resolveTierAccent, resolveTierGradientColor } from '@/src/theme/tierAccents';
import { resolveVariantAccent } from '@/src/theme/variantAccents';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const NEW_BADGE_FILL = '#FFE033';
const NEW_BADGE_SHADOW = 'rgba(72, 52, 64, 0.72)';
const FUSION_PARENT_SLIME_SIZE = 138;
const FUSION_FOUR_PARENT_SLIME_SIZE = 108;
const FUSION_PARENT_MERGE_END_SCALE = 0.64;

export type FusionRevealOverlayProps = {
  revealKey: number;
  parentSpeciesAId: string;
  parentSpeciesBId: string;
  /** When four ids are passed, all parents orbit the center (Dreamer fusion). */
  parentSpeciesIds?: readonly [string, string, string, string];
  resultSpecies: Species;
  resultVariant?: SlimeVariant;
  isNewSpecies: boolean;
  onDismiss: () => void;
};

export function FusionRevealOverlay({
  revealKey,
  parentSpeciesAId,
  parentSpeciesBId,
  parentSpeciesIds,
  resultSpecies,
  resultVariant,
  isNewSpecies,
  onDismiss,
}: FusionRevealOverlayProps) {
  const isFourParentMode = parentSpeciesIds?.length === 4;
  const tier = resultSpecies.tier as TierType;
  const variantRevealLevel = resolveVariantRevealLevel(resultVariant);
  const showVariant = shouldShowFusionRevealVariant(resultVariant);
  const usesVariantTease = usesFusionVariantSilhouetteTease(resultVariant);
  const usesSilhouette = usesFusionSilhouetteAnticipation(isNewSpecies, resultVariant);
  const anticipationMs = resolveFusionVariantAnticipationMs(tier, isNewSpecies, resultVariant);
  const silhouetteRevealMs = resolveFusionSilhouetteRevealMs(resultVariant);
  const variantCtaExtraDelay = VARIANT_REVEAL_CTA_EXTRA_DELAY_MS[variantRevealLevel];
  const variantLabel =
    resultVariant != null ? SLIME_VARIANT_LABELS[resultVariant] : undefined;
  const mergeMs = resolveFusionMergeMs(isNewSpecies);
  const swirlDuration = isFourParentMode
    ? resolveFusionFourParentSwirlMs(isNewSpecies)
    : resolveFusionSwirlMs(isNewSpecies);
  const iconGradientColor = resolveTierGradientColor(tier);

  const [revealed, setRevealed] = useState(false);
  const [ctaReady, setCtaReady] = useState(false);
  const [newBadgeSparkleToken, setNewBadgeSparkleToken] = useState(0);
  const [showParents, setShowParents] = useState(true);
  const [nameRowWidth, setNameRowWidth] = useState(0);
  const [starTeaseActive, setStarTeaseActive] = useState(false);
  const [starTeaseKey, setStarTeaseKey] = useState(0);

  const merge = useRef(new Animated.Value(0)).current;
  const parentDrain = useRef(new Animated.Value(0)).current;
  const handoff = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const revealBlend = useRef(new Animated.Value(0)).current;
  const slimePop = useRef(new Animated.Value(0.86)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const metaOpacity = useRef(new Animated.Value(0)).current;
  const newBadgeOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const variantLabelScale = useRef(new Animated.Value(1)).current;

  const parentStartOffsetX = isNewSpecies ? (isFourParentMode ? 88 : 94) : isFourParentMode ? 72 : 76;
  const swirlPath = useMemo(
    () => buildFusionParentSwirlPath(parentStartOffsetX),
    [parentStartOffsetX]
  );
  const fourParentPath = useMemo(
    () => (isFourParentMode ? buildFusionFourParentOrbitPath(parentStartOffsetX) : null),
    [isFourParentMode, parentStartOffsetX]
  );
  const parentSlimeSize = isFourParentMode ? FUSION_FOUR_PARENT_SLIME_SIZE : FUSION_PARENT_SLIME_SIZE;

  useEffect(() => {
    setRevealed(false);
    setCtaReady(false);
    setNewBadgeSparkleToken(0);
    setShowParents(true);
    setNameRowWidth(0);
    setStarTeaseActive(false);
    setStarTeaseKey(0);
    merge.setValue(0);
    parentDrain.setValue(0);
    handoff.setValue(0);
    bounce.setValue(0);
    revealBlend.setValue(0);
    slimePop.setValue(0.86);
    flashOpacity.setValue(0);
    metaOpacity.setValue(0);
    newBadgeOpacity.setValue(0);
    ctaOpacity.setValue(0);
    cardOpacity.setValue(0);
    variantLabelScale.setValue(1);

    let cancelled = false;
    let bounceLoop: Animated.CompositeAnimation | null = null;
    let newBadgeTimer: ReturnType<typeof setTimeout> | null = null;
    let starTeaseEndTimer: ReturnType<typeof setTimeout> | null = null;
    let postStarBeatTimer: ReturnType<typeof setTimeout> | null = null;
    let silhouetteRevealTimer: ReturnType<typeof setTimeout> | null = null;

    const bounceMs = usesVariantTease ? VARIANT_STAR_PULSE_MS : FUSION_BOUNCE_MS;
    const revealFlashPeak = resolveFusionFlashPeak(0.22, resultVariant);

    const showNewBadgeEffects = () => {
      if (!isNewSpecies) return;
      newBadgeTimer = setTimeout(() => {
        if (cancelled) return;
        setNewBadgeSparkleToken((token) => token + 1);
        Animated.timing(newBadgeOpacity, {
          toValue: 1,
          duration: FUSION_NEW_BADGE_FADE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, FUSION_NEW_BADGE_DELAY_MS);
    };

    const triggerVariantRevealEffects = () => {
      if (variantRevealLevel === 'standard') return;
      variantLabelScale.setValue(0.88);
      Animated.spring(variantLabelScale, {
        toValue: 1,
        friction: 5.5,
        tension: 140,
        useNativeDriver: true,
      }).start();
    };

    const completePresentation = () => {
      if (cancelled) return;

      if (showVariant) {
        metaOpacity.setValue(1);
      }

      Animated.timing(metaOpacity, {
        toValue: 1,
        duration: FUSION_META_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      showNewBadgeEffects();
      triggerVariantRevealEffects();

      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 240,
        delay: FUSION_CTA_DELAY_MS + variantCtaExtraDelay,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !cancelled) setCtaReady(true);
      });
    };

    const runRevealTransition = () => {
      if (cancelled) return;

      bounceLoop?.stop();
      bounce.stopAnimation();
      bounce.setValue(0);
      revealBlend.setValue(0);
      slimePop.setValue(usesVariantTease ? 0.92 : 0.86);
      if (showVariant) {
        metaOpacity.setValue(1);
      }
      setRevealed(true);
      setStarTeaseActive(false);

      Animated.parallel([
        Animated.timing(revealBlend, {
          toValue: 1,
          duration: silhouetteRevealMs,
          easing: usesVariantTease ? Easing.inOut(Easing.cubic) : Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slimePop, {
          toValue: 1,
          friction: usesVariantTease ? 7.5 : 6.5,
          tension: usesVariantTease ? 96 : 118,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: revealFlashPeak,
            duration: usesVariantTease ? 120 : 70,
            useNativeDriver: true,
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: usesVariantTease ? 520 : 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => completePresentation());
    };

    let handoffTimer: ReturnType<typeof setTimeout> | null = null;
    let handoffTriggered = false;
    let duplicateSpringStarted = false;

    const beginDuplicateResultSpring = () => {
      if (duplicateSpringStarted || cancelled) return;
      duplicateSpringStarted = true;
      slimePop.setValue(0.94);
      Animated.parallel([
        Animated.spring(slimePop, {
          toValue: 1,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: resolveFusionFlashPeak(0.18, resultVariant),
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => completePresentation());
    };

    const runHandoff = (onComplete: () => void) => {
      Animated.parallel([
        Animated.timing(handoff, {
          toValue: 1,
          duration: FUSION_HANDOFF_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: usesSilhouette ? 0.2 : 0.16,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished: handoffFinished }) => {
        if (!handoffFinished || cancelled) return;
        onComplete();
      });
    };

    const triggerHandoff = (onComplete: () => void) => {
      if (handoffTriggered || cancelled) return;
      handoffTriggered = true;
      runHandoff(onComplete);
    };

    const startSilhouetteBounce = () => {
      bounce.setValue(0);
      bounceLoop?.stop();
      bounceLoop = Animated.loop(
        Animated.timing(bounce, {
          toValue: 1,
          duration: bounceMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      );
      bounceLoop.start();
    };

    const scheduleSilhouetteReveal = () => {
      if (usesVariantTease) {
        startSilhouetteBounce();
        setStarTeaseActive(true);
        setStarTeaseKey((key) => key + 1);
        starTeaseEndTimer = setTimeout(() => {
          if (cancelled) return;
          setStarTeaseActive(false);
          bounceLoop?.stop();
          bounce.stopAnimation();
          bounce.setValue(0);
          postStarBeatTimer = setTimeout(() => {
            if (!cancelled) runRevealTransition();
          }, VARIANT_STAR_TEASE_FINISH_BEAT_MS);
        }, VARIANT_STAR_TEASE_MS);
        return;
      }

      silhouetteRevealTimer = setTimeout(() => {
        if (cancelled) return;
        bounceLoop?.stop();
        runRevealTransition();
      }, anticipationMs);
    };

    const finishParentSwirl = () => {
      if (cancelled) return;

      if (usesSilhouette && anticipationMs > 0) {
        setShowParents(false);
        if (!handoffTriggered) {
          startSilhouetteBounce();
          triggerHandoff(scheduleSilhouetteReveal);
        }
        return;
      }

      setShowParents(false);
      beginDuplicateResultSpring();
    };

    const runSequence = () => {
      if (usesSilhouette && anticipationMs > 0) {
        handoffTimer = setTimeout(() => {
          startSilhouetteBounce();
          triggerHandoff(scheduleSilhouetteReveal);
        }, Math.round(swirlDuration * FUSION_SILHOUETTE_HANDOFF_START_RATIO));
      }

      Animated.timing(parentDrain, {
        toValue: 1,
        duration: swirlDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished: drainFinished }) => {
        if (drainFinished) finishParentSwirl();
      });

      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(merge, {
          toValue: 1,
          duration: mergeMs,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: resolveFusionFlashPeak(0.28, resultVariant),
            duration: mergeMs * 0.45,
            useNativeDriver: true,
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: mergeMs * 0.55,
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (!finished || cancelled) return;

        if (usesSilhouette && anticipationMs > 0) return;

        setRevealed(true);
        triggerHandoff(() => {
          if (!duplicateSpringStarted && !cancelled) {
            beginDuplicateResultSpring();
          }
        });
      });
    };

    runSequence();

    return () => {
      cancelled = true;
      bounceLoop?.stop();
      if (newBadgeTimer) clearTimeout(newBadgeTimer);
      if (handoffTimer) clearTimeout(handoffTimer);
      if (starTeaseEndTimer) clearTimeout(starTeaseEndTimer);
      if (postStarBeatTimer) clearTimeout(postStarBeatTimer);
      if (silhouetteRevealTimer) clearTimeout(silhouetteRevealTimer);
    };
  }, [
    anticipationMs,
    bounce,
    cardOpacity,
    ctaOpacity,
    flashOpacity,
    handoff,
    isNewSpecies,
    isFourParentMode,
    merge,
    metaOpacity,
    mergeMs,
    newBadgeOpacity,
    parentDrain,
    revealBlend,
    revealKey,
    resultVariant,
    showVariant,
    silhouetteRevealMs,
    slimePop,
    swirlDuration,
    usesSilhouette,
    usesVariantTease,
    variantCtaExtraDelay,
    variantLabelScale,
    variantRevealLevel,
  ]);

  const parentHandoffOpacity = handoff.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [1, 0.95, 0],
  });
  const parentSwirlOpacity = parentDrain.interpolate({
    inputRange: [0, 0.88, 0.97, 1],
    outputRange: [1, 1, 0.35, 0],
  });
  const parentDuplicateOpacity = Animated.multiply(
    parentHandoffOpacity,
    parentSwirlOpacity
  );
  const parentOpacity = usesSilhouette ? parentSwirlOpacity : parentDuplicateOpacity;
  const parentDrainScale = parentDrain.interpolate({
    inputRange: (isFourParentMode && fourParentPath ? fourParentPath : swirlPath).inputRange,
    outputRange: (isFourParentMode && fourParentPath ? fourParentPath : swirlPath).scale,
  });
  const fourParentMotion = useMemo(() => {
    if (!isFourParentMode || !fourParentPath) return null;
    return fourParentPath.parents.map((parent) => ({
      translateX: parentDrain.interpolate({
        inputRange: fourParentPath.inputRange,
        outputRange: parent.x,
      }),
      translateY: parentDrain.interpolate({
        inputRange: fourParentPath.inputRange,
        outputRange: parent.y,
      }),
      rotate: parentDrain.interpolate({
        inputRange: fourParentPath.inputRange,
        outputRange: parent.rotate,
      }),
    }));
  }, [fourParentPath, isFourParentMode, parentDrain]);
  const parentATranslateX = parentDrain.interpolate({
    inputRange: swirlPath.inputRange,
    outputRange: swirlPath.parentA.x,
  });
  const parentBTranslateX = parentDrain.interpolate({
    inputRange: swirlPath.inputRange,
    outputRange: swirlPath.parentB.x,
  });
  const parentATranslateY = parentDrain.interpolate({
    inputRange: swirlPath.inputRange,
    outputRange: swirlPath.parentA.y,
  });
  const parentBTranslateY = parentDrain.interpolate({
    inputRange: swirlPath.inputRange,
    outputRange: swirlPath.parentB.y,
  });
  const parentARotate = parentDrain.interpolate({
    inputRange: swirlPath.inputRange,
    outputRange: swirlPath.parentA.rotate,
  });
  const parentBRotate = parentDrain.interpolate({
    inputRange: swirlPath.inputRange,
    outputRange: swirlPath.parentB.rotate,
  });

  const resultIntroOpacity = handoff.interpolate({
    inputRange: [0, 0.16, 1],
    outputRange: [0, 0.42, 1],
  });
  const resultIntroScale = handoff.interpolate({
    inputRange: [0, 1],
    outputRange: [FUSION_PARENT_MERGE_END_SCALE, 0.94],
  });
  const silhouetteOpacity = parentDrain.interpolate({
    inputRange: [0, 0.52, 0.64, 0.78, 0.92, 1],
    outputRange: [0, 0, 0.34, 0.62, 0.92, 1],
  });
  const silhouetteBaseScale = parentDrain.interpolate({
    inputRange: [0, 0.52, 0.64, 0.82, 1],
    outputRange: [FUSION_PARENT_MERGE_END_SCALE, FUSION_PARENT_MERGE_END_SCALE, 0.78, 0.94, 1],
  });

  const bounceTranslateY = bounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -10, 0],
  });
  const bounceScaleY = bounce.interpolate({
    inputRange: [0, 0.1, 0.5, 0.9, 1],
    outputRange: [0.97, 0.97, 1.04, 0.975, 0.97],
  });
  const bounceScaleX = bounce.interpolate({
    inputRange: [0, 0.1, 0.5, 0.9, 1],
    outputRange: [1.015, 1.015, 0.99, 1.01, 1.015],
  });

  const silhouetteRevealOpacity = revealBlend.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: usesVariantTease ? [1, 0.55, 0] : [1, 0.35, 0],
  });
  const slimeRevealOpacity = revealBlend.interpolate({
    inputRange: [0, 0.18, 0.5, 1],
    outputRange: usesVariantTease ? [0, 0.28, 0.9, 1] : [0, 0.2, 0.88, 1],
  });

  const showVariantStarTease =
    showVariant &&
    usesSilhouette &&
    variantRevealLevel !== 'standard' &&
    starTeaseActive &&
    !revealed;


  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.card, { opacity: cardOpacity }]}>
        <Text style={styles.resultYouGot}>You Got:</Text>

        <View style={styles.iconFrame}>
          <View style={styles.iconBackground}>
            <Svg
              pointerEvents="none"
              style={styles.iconGradient}
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <Defs>
                <LinearGradient id={`fusion-reveal-bg-${revealKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={iconGradientColor} stopOpacity={0} />
                  <Stop offset="52%" stopColor={iconGradientColor} stopOpacity={0.1} />
                  <Stop offset="100%" stopColor={iconGradientColor} stopOpacity={0.72} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100" height="100" fill={`url(#fusion-reveal-bg-${revealKey})`} />
            </Svg>

            <Animated.View
              style={[styles.flashOverlay, { opacity: flashOpacity }]}
              pointerEvents="none"
            />

            {showParents ? (
              isFourParentMode && parentSpeciesIds && fourParentMotion ? (
                parentSpeciesIds.map((speciesId, index) => (
                  <Animated.View
                    key={speciesId}
                    style={[
                      styles.parentSlime,
                      {
                        width: parentSlimeSize,
                        height: parentSlimeSize,
                        marginLeft: -parentSlimeSize / 2,
                        marginTop: -parentSlimeSize / 2,
                        opacity: parentOpacity,
                        transform: [
                          { translateX: fourParentMotion[index].translateX },
                          { translateY: fourParentMotion[index].translateY },
                          { rotate: fourParentMotion[index].rotate },
                          { scale: parentDrainScale },
                        ],
                      },
                    ]}
                  >
                    <SlimeArtwork
                      speciesId={speciesId}
                      style={{ width: parentSlimeSize, height: parentSlimeSize }}
                      imageStyle={styles.parentImage}
                      resizeMode="contain"
                      foilMotion="off"
                    />
                  </Animated.View>
                ))
              ) : (
              <>
                <Animated.View
                  style={[
                    styles.parentSlime,
                    {
                      opacity: parentOpacity,
                      transform: [
                        { translateX: parentATranslateX },
                        { translateY: parentATranslateY },
                        { rotate: parentARotate },
                        { scale: parentDrainScale },
                      ],
                    },
                  ]}
                >
                  <SlimeArtwork
                    speciesId={parentSpeciesAId}
                    style={styles.parentArtwork}
                    imageStyle={styles.parentImage}
                    resizeMode="contain"
                    foilMotion="off"
                  />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.parentSlime,
                    {
                      opacity: parentOpacity,
                      transform: [
                        { translateX: parentBTranslateX },
                        { translateY: parentBTranslateY },
                        { rotate: parentBRotate },
                        { scale: parentDrainScale },
                      ],
                    },
                  ]}
                >
                  <SlimeArtwork
                    speciesId={parentSpeciesBId}
                    style={styles.parentArtwork}
                    imageStyle={styles.parentImage}
                    resizeMode="contain"
                    foilMotion="off"
                  />
                </Animated.View>
              </>
              )
            ) : null}

            <View style={styles.mergeStage}>
              {usesSilhouette ? (
                <>
                  {!revealed ? (
                    <Animated.View
                      collapsable={false}
                      style={[
                        styles.slimeLayer,
                        {
                          opacity: silhouetteOpacity,
                          transform: [
                            { scale: silhouetteBaseScale },
                            { translateY: bounceTranslateY },
                            { scaleX: bounceScaleX },
                            { scaleY: bounceScaleY },
                          ],
                        },
                      ]}
                    >
                      <SlimeSilhouetteArtwork
                        speciesId={resultSpecies.id}
                        style={styles.resultArtwork}
                        imageStyle={styles.resultImage}
                        resizeMode="contain"
                      />
                    </Animated.View>
                  ) : (
                    <>
                      <Animated.View
                        style={[
                          styles.slimeLayer,
                          { opacity: silhouetteRevealOpacity },
                        ]}
                      >
                        <SlimeSilhouetteArtwork
                          speciesId={resultSpecies.id}
                          style={styles.resultArtwork}
                          imageStyle={styles.resultImage}
                          resizeMode="contain"
                        />
                      </Animated.View>
                      <Animated.View
                        style={[
                          styles.slimeLayer,
                          {
                            opacity: slimeRevealOpacity,
                            transform: [{ scale: slimePop }],
                          },
                        ]}
                      >
                        <SlimeArtwork
                          speciesId={resultSpecies.id}
                          variant={resultVariant}
                          style={styles.resultArtwork}
                          imageStyle={styles.resultImage}
                          resizeMode="contain"
                          foilMotion="full"
                        />
                      </Animated.View>
                    </>
                  )}
                </>
              ) : revealed ? (
                <Animated.View
                  collapsable={false}
                  style={[
                    styles.slimeLayer,
                    {
                      opacity: showParents ? resultIntroOpacity : 1,
                      transform: [
                        {
                          scale: showParents ? resultIntroScale : slimePop,
                        },
                      ],
                    },
                  ]}
                >
                  <SlimeArtwork
                    speciesId={resultSpecies.id}
                    variant={resultVariant}
                    style={styles.resultArtwork}
                    imageStyle={styles.resultImage}
                    resizeMode="contain"
                    foilMotion="full"
                  />
                </Animated.View>
              ) : null}
            </View>

            {showVariantStarTease ? (
              <VariantSilhouetteStarFlash
                level={variantRevealLevel}
                effectKey={starTeaseKey}
                teasing
                slimeMaskOffsetY={bounceTranslateY}
              />
            ) : null}
          </View>
        </View>

        <Animated.View style={{ opacity: metaOpacity, alignItems: 'center', width: '100%' }}>
          <View
            style={styles.resultNameRow}
            onLayout={(event) => {
              const width = Math.round(event.nativeEvent.layout.width);
              if (width > 0) {
                setNameRowWidth((prev) => (prev === width ? prev : width));
              }
            }}
          >
            <FitText
              text={resultSpecies.name}
              preset="fusionRevealName"
              maxWidth={nameRowWidth > 0 ? nameRowWidth : undefined}
              style={styles.resultName}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            />
          </View>
          <FusionTierGradientText tier={tier} text={TIER_LABELS[tier]} />
          {showVariant && variantLabel && resultVariant ? (
            <Animated.View style={{ transform: [{ scale: variantLabelScale }] }}>
              <FusionGradientVariantText variant={resultVariant} text={variantLabel} />
            </Animated.View>
          ) : null}
        </Animated.View>

        {isNewSpecies ? (
          <>
            {newBadgeSparkleToken > 0 ? (
              <View style={styles.newBadgeSparkleHost} pointerEvents="none">
                <NewBadgeSparkleBurst burstKey={newBadgeSparkleToken} delayMs={0} />
              </View>
            ) : null}
            <View style={styles.newBadgeHost} pointerEvents="none">
              <Animated.View style={{ opacity: newBadgeOpacity }}>
                <Text style={styles.newBadgeText}>New!</Text>
              </Animated.View>
            </View>
          </>
        ) : null}

        <Animated.View style={{ opacity: ctaOpacity, width: '100%', alignItems: 'center' }}>
          <Pressable
            style={({ pressed }) => [styles.resultBtn, pressed && ctaReady && styles.resultBtnPressed]}
            onPress={onDismiss}
            disabled={!ctaReady}
          >
            <Text style={styles.resultBtnText}>Yay!</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
      </View>
    </Modal>
  );
}

const FUSION_TIER_SVG_H = 24;
const FUSION_TIER_FONT = 22;
const FUSION_TIER_BASELINE = 21;

function FusionTierGradientText({ tier, text }: { tier: TierType; text: string }) {
  const [width, setWidth] = useState(0);
  const tierAccent = resolveTierAccent(tier);
  const gradId = `fusion-reveal-tier-${useId().replace(/:/g, '')}`;

  return (
    <View style={styles.tierGradientWrap}>
      <Text
        style={styles.tierMeasure}
        onLayout={(e) => {
          const w = Math.ceil(e.nativeEvent.layout.width);
          if (w > 0) setWidth((prev) => (prev === w ? prev : w));
        }}
      >
        {text}
      </Text>
      {width > 0 ? (
        <Svg width={width} height={FUSION_TIER_SVG_H} viewBox={`0 0 ${width} ${FUSION_TIER_SVG_H}`}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={tierAccent.borderTop} />
              <Stop offset="100%" stopColor={tierAccent.borderBottom} />
            </LinearGradient>
          </Defs>
          <SvgText
            x={width / 2}
            y={FUSION_TIER_BASELINE}
            textAnchor="middle"
            fontFamily={APP_FONT_FAMILY}
            fontSize={FUSION_TIER_FONT}
            fontWeight="800"
            fill={`url(#${gradId})`}
          >
            {text}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}

function FusionGradientVariantText({
  variant,
  text,
}: {
  variant: SlimeVariant;
  text: string;
}) {
  const accent = resolveVariantAccent(variant);
  const [width, setWidth] = useState(0);
  const gradId = `fusion-reveal-variant-${useId().replace(/:/g, '')}`;

  if (!accent) {
    return (
      <Text style={styles.variantFallback} numberOfLines={1}>
        {text}
      </Text>
    );
  }

  return (
    <View style={styles.variantLineWrap}>
      <Text
        style={styles.variantMeasure}
        onLayout={(e) => {
          const w = Math.ceil(e.nativeEvent.layout.width);
          if (w > 0) setWidth((prev) => (prev === w ? prev : w));
        }}
      >
        {text}
      </Text>
      {width > 0 ? (
        <Svg width={width} height={26} viewBox={`0 0 ${width} 26`}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              {accent.stops.map((stop) => (
                <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </LinearGradient>
          </Defs>
          <SvgText
            x={width / 2}
            y={21}
            textAnchor="middle"
            fontFamily={APP_FONT_FAMILY}
            fontSize={20}
            fontWeight="900"
            fill={`url(#${gradId})`}
          >
            {text}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}

const styles = createAppStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#F1E2E4',
    borderRadius: 18,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  resultYouGot: {
    alignSelf: 'flex-start',
    fontSize: 32,
    lineHeight: 28,
    fontWeight: '800',
    color: '#EC8E91',
    marginBottom: -20,
  },
  iconFrame: {
    width: '100%',
    maxWidth: 248,
    aspectRatio: 1.3,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  iconBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 4,
  },
  parentSlime: {
    position: 'absolute',
    width: FUSION_PARENT_SLIME_SIZE,
    height: FUSION_PARENT_SLIME_SIZE,
    left: '50%',
    top: '50%',
    marginLeft: -FUSION_PARENT_SLIME_SIZE / 2,
    marginTop: -FUSION_PARENT_SLIME_SIZE / 2,
    zIndex: 3,
  },
  parentArtwork: { width: FUSION_PARENT_SLIME_SIZE, height: FUSION_PARENT_SLIME_SIZE },
  parentImage: { width: '100%', height: '100%' },
  mergeStage: {
    width: '88%',
    height: '88%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  slimeLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultArtwork: { width: '100%', height: '100%' },
  resultImage: { width: '100%', height: '100%' },
  resultNameRow: {
    width: '100%',
    alignItems: 'center',
  },
  resultName: {
    fontWeight: '800',
    color: '#EC8E91',
    textAlign: 'center',
    marginBottom: -2,
  },
  tierGradientWrap: {
    alignItems: 'center',
    minHeight: FUSION_TIER_SVG_H,
    marginBottom: -2,
  },
  tierMeasure: {
    position: 'absolute',
    opacity: 0,
    fontSize: FUSION_TIER_FONT,
    fontWeight: '800',
  },
  variantLineWrap: {
    alignItems: 'center',
    minHeight: 24,
    marginTop: -4,
    marginBottom: 4,
  },
  variantMeasure: {
    position: 'absolute',
    opacity: 0,
    fontSize: 20,
    fontWeight: '900',
  },
  variantFallback: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '800',
    color: '#EC8E91',
    marginTop: -4,
    marginBottom: 4,
  },
  newBadgeSparkleHost: {
    position: 'absolute',
    top: 44,
    right: 14,
    width: 0,
    height: 0,
    zIndex: 8,
    overflow: 'visible',
  },
  newBadgeHost: {
    position: 'absolute',
    top: 28,
    right: 8,
    zIndex: 7,
    transform: [{ rotate: '12deg' }],
  },
  newBadgeText: {
    fontSize: 42,
    lineHeight: 44,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: NEW_BADGE_FILL,
    textShadowColor: NEW_BADGE_SHADOW,
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 1,
  },
  resultBtn: {
    width: '58%',
    minWidth: 170,
    backgroundColor: '#F2BFC4',
    borderColor: '#EC8E91',
    borderWidth: 6,
    borderRadius: 22,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resultBtnPressed: {
    opacity: 0.88,
  },
  resultBtnText: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
    color: '#EC8E91',
  },
});
