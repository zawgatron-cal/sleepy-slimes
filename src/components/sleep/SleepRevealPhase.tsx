/**
 * Slime reveal phase — anticipation → pop-in → name/tier/variant stagger.
 */

import { useEffect, useId, useRef, useState } from 'react';
import {
  View,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  Text,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { HexTileBackground } from '@/src/components/HexTileBackground';
import { SlimeArtwork } from '@/src/components/SlimeArtwork';
import { SlimeSilhouetteArtwork } from '@/src/components/SlimeSilhouetteArtwork';
import {
  SLIME_VARIANT_LABELS,
  type SlimeVariant as SlimeVariantType,
  type Tier as TierType,
} from '@/src/constants/game';
import {
  resolveSleepRevealConfig,
  shouldShowRevealVariant,
  shouldSkipSleepRevealAnticipation,
  usesSilhouetteSleepRevealAnticipation,
  usesUltraRareRevealAmbience,
  SLEEP_REVEAL_ULTRA_RARE_BOUNCE_MS,
  SLEEP_REVEAL_SILHOUETTE_BOUNCE_MS,
  SLEEP_REVEAL_SILHOUETTE_REVEAL_MS,
  SLEEP_REVEAL_QUICK_COVER_MS,
  SLEEP_REVEAL_QUICK_CTA_DELAY_MS,
  SLEEP_REVEAL_QUICK_FLASH_SCALE,
  SLEEP_REVEAL_QUICK_META_MS,
} from '@/src/constants/sleepReveal';
import { SUMMARY_BACKGROUND_TILE } from '@/src/constants/summaryScreenAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { OutlinedSvgLabel } from '@/src/components/OutlinedSvgLabel';
import { NewBadgeSparkleBurst } from '@/src/components/sleep/NewBadgeSparkleBurst';
import { UltraRareRevealAmbience } from '@/src/components/sleep/UltraRareRevealAmbience';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';
import { resolveTierGradient, resolveTierGradientFromLabel } from '@/src/theme/tierAccents';
import { resolveVariantAccent } from '@/src/theme/variantAccents';

const t = mainScreens.sleep.summary;
const SUMMARY_HEX_TILES_ACROSS = 3;
const SUMMARY_HEX_OPACITY = 0.55;
const STATS_FONT_SIZE = 28;
const STATS_LINE_HEIGHT = 42;
const STATS_STROKE_WIDTH = 2.4;
const STATS_STROKE = t.titleStroke;
const STATS_FILL = t.titleFill;
const NAME_STROKE = t.nameStroke;
const NAME_FILL = t.nameFill;
const NAME_LINE_HEIGHT = 54;
const NAME_STROKE_WIDTH = 2.8;
const NEW_BADGE_FILL = '#FFE033';
const NEW_BADGE_SHADOW = 'rgba(72, 52, 64, 0.72)';
const NEW_BADGE_REVEAL_DELAY_MS = 520;
const NEW_BADGE_QUICK_REVEAL_DELAY_MS = 180;
const NEW_BADGE_FADE_MS = 300;
const NEW_BADGE_QUICK_FADE_MS = 280;

export type SleepRevealPhaseProps = {
  /** Changes when advancing to the next slime — retriggers the reveal sequence. */
  revealKey: number;
  revealProgress: string;
  speciesName: string;
  tier: TierType;
  tierLabel: string;
  speciesId: string;
  slimeVariant?: SlimeVariantType;
  isNewSpecies?: boolean;
  ctaLabel: string;
  onPressCta: () => void;
};

export function SleepRevealPhase({
  revealKey,
  revealProgress,
  speciesName,
  tier,
  tierLabel,
  speciesId,
  slimeVariant,
  isNewSpecies = false,
  ctaLabel,
  onPressCta,
}: SleepRevealPhaseProps) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const config = resolveSleepRevealConfig(tier, slimeVariant, isNewSpecies);
  const isQuickReveal = shouldSkipSleepRevealAnticipation(tier, isNewSpecies);
  const usesSilhouetteAnticipation =
    !isQuickReveal && usesSilhouetteSleepRevealAnticipation(tier, isNewSpecies);
  const showUltraRareAmbience = usesUltraRareRevealAmbience(tier, isQuickReveal);
  const tierGradient = resolveTierGradient(tier);
  const showVariant = shouldShowRevealVariant(slimeVariant);
  const variantLabel =
    slimeVariant != null ? SLIME_VARIANT_LABELS[slimeVariant] : undefined;

  const [revealed, setRevealed] = useState(false);
  const [ctaReady, setCtaReady] = useState(false);
  const [newBadgeSparkleToken, setNewBadgeSparkleToken] = useState(0);

  const pulse = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const revealBlend = useRef(new Animated.Value(0)).current;
  const slimePop = useRef(new Animated.Value(0.86)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const coverOpacity = useRef(new Animated.Value(1)).current;
  const metaOpacity = useRef(new Animated.Value(0)).current;
  const newBadgeOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const questionScale = useRef(new Animated.Value(0)).current;
  const cardPop = useRef(new Animated.Value(0.94)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setRevealed(false);
    setCtaReady(false);
    setNewBadgeSparkleToken(0);
    pulse.setValue(0);
    bounce.setValue(0);
    revealBlend.setValue(0);
    slimePop.setValue(0.86);
    flashOpacity.setValue(0);
    coverOpacity.setValue(usesSilhouetteAnticipation ? 0 : 1);
    questionScale.setValue(0);
    cardPop.setValue(0.94);
    screenFade.setValue(isQuickReveal ? 0.7 : 1);
    metaOpacity.setValue(0);
    newBadgeOpacity.setValue(0);
    ctaOpacity.setValue(0);

    let cancelled = false;
    let newBadgeTimer: ReturnType<typeof setTimeout> | null = null;

    const showNewBadgeEffects = (delayMs: number, fadeMs = NEW_BADGE_FADE_MS) => {
      if (!isNewSpecies) return;
      newBadgeTimer = setTimeout(() => {
        if (cancelled) return;
        setNewBadgeSparkleToken((token) => token + 1);
        Animated.timing(newBadgeOpacity, {
          toValue: 1,
          duration: fadeMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, delayMs);
    };

    const completeRevealPresentation = () => {
      if (cancelled) return;

      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }).start();

      Animated.timing(metaOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      if (isNewSpecies) {
        showNewBadgeEffects(NEW_BADGE_REVEAL_DELAY_MS);
      }

      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 280,
        delay: 280,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !cancelled) setCtaReady(true);
      });
    };

    const finishReveal = () => {
      if (cancelled) return;
      setRevealed(true);
      completeRevealPresentation();
    };

    const runSilhouetteRevealTransition = () => {
      if (cancelled) return;

      bounce.stopAnimation();
      bounce.setValue(0);
      revealBlend.setValue(0);
      slimePop.setValue(0.86);
      setRevealed(true);

      Animated.parallel([
        Animated.timing(revealBlend, {
          toValue: 1,
          duration: SLEEP_REVEAL_SILHOUETTE_REVEAL_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slimePop, {
          toValue: 1,
          friction: 6.5,
          tension: 118,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: 0.2,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 340,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => completeRevealPresentation());
    };

    const runRevealAnimation = () => {
      if (usesSilhouetteAnticipation) {
        runSilhouetteRevealTransition();
        return;
      }

      Animated.parallel([
        Animated.timing(coverOpacity, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: config.flashStrength,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start(() => finishReveal());
    };

    const runQuickRevealAnimation = () => {
      Animated.parallel([
        Animated.timing(screenFade, {
          toValue: 1,
          duration: SLEEP_REVEAL_QUICK_COVER_MS + 80,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(coverOpacity, {
          toValue: 0,
          duration: SLEEP_REVEAL_QUICK_COVER_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(cardPop, {
          toValue: 1,
          friction: 7,
          tension: 130,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: config.flashStrength * SLEEP_REVEAL_QUICK_FLASH_SCALE,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (cancelled) return;
        setRevealed(true);

        Animated.timing(metaOpacity, {
          toValue: 1,
          duration: SLEEP_REVEAL_QUICK_META_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();

        if (isNewSpecies) {
          showNewBadgeEffects(NEW_BADGE_QUICK_REVEAL_DELAY_MS, NEW_BADGE_QUICK_FADE_MS);
        }

        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 180,
          delay: SLEEP_REVEAL_QUICK_CTA_DELAY_MS,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && !cancelled) setCtaReady(true);
        });
      });
    };

    if (config.anticipationMs <= 0) {
      const quickTimer = setTimeout(() => {
        if (!cancelled) runQuickRevealAnimation();
      }, 50);

      return () => {
        cancelled = true;
        if (newBadgeTimer) clearTimeout(newBadgeTimer);
        clearTimeout(quickTimer);
      };
    }

    const pulseHalfMs = 680;
    const bounceMs = showUltraRareAmbience
      ? SLEEP_REVEAL_ULTRA_RARE_BOUNCE_MS
      : SLEEP_REVEAL_SILHOUETTE_BOUNCE_MS;

    let anticipationLoop: Animated.CompositeAnimation | null = null;

    if (usesSilhouetteAnticipation) {
      anticipationLoop = Animated.loop(
        Animated.timing(bounce, {
          toValue: 1,
          duration: bounceMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      );
      anticipationLoop.start();
    } else {
      anticipationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: pulseHalfMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: pulseHalfMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      anticipationLoop.start();
    }

    const questionPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(questionScale, {
          toValue: 1,
          duration: 680,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(questionScale, {
          toValue: 0,
          duration: 680,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    questionPulse.start();

    const revealTimer = setTimeout(() => {
      if (cancelled) return;

      anticipationLoop?.stop();
      questionPulse.stop();
      pulse.stopAnimation();
      bounce.stopAnimation();

      runRevealAnimation();
    }, config.anticipationMs);

    return () => {
      cancelled = true;
      if (newBadgeTimer) clearTimeout(newBadgeTimer);
      clearTimeout(revealTimer);
      anticipationLoop?.stop();
      questionPulse.stop();
    };
  }, [revealKey, speciesId, tier, slimeVariant, isNewSpecies, usesSilhouetteAnticipation, showUltraRareAmbience, config.flashStrength]);

  const revealCardHeight = Math.min(470, Math.max(360, winH * 0.48));
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const bounceTranslateY = bounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -12, 0],
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
    outputRange: [1, 0.35, 0],
  });
  const slimeRevealOpacity = revealBlend.interpolate({
    inputRange: [0, 0.18, 0.5, 1],
    outputRange: [0, 0.2, 0.88, 1],
  });
  const questionMarkScale = questionScale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.1],
  });

  return (
    <View style={styles.root}>
      <HexTileBackground
        width={winW}
        height={winH}
        tileSource={SUMMARY_BACKGROUND_TILE}
        tilesAcross={SUMMARY_HEX_TILES_ACROSS}
        opacity={SUMMARY_HEX_OPACITY}
      />

      <View
        style={[
          styles.fadeInner,
          {
            paddingTop: insets.top + 18,
            paddingBottom: Math.max(insets.bottom, 16) + 2,
            paddingHorizontal: 28,
          },
        ]}
      >
        <Animated.View style={[styles.centerColumn, { opacity: screenFade }]}>
          <View style={styles.statsBlock}>
            <OutlinedStatsRow leftText="You found a..." rightText={revealProgress} />
          </View>

          <View style={styles.revealStage}>
            <Animated.View
              style={[
                styles.cardWrap,
                isQuickReveal
                  ? { transform: [{ scale: cardPop }] }
                  : !revealed && !usesSilhouetteAnticipation
                    ? {
                        transform: [{ scale: pulseScale }],
                      }
                    : null,
              ]}
            >
            <View
              style={[
                styles.outerCard,
                {
                  height: revealCardHeight,
                  borderColor: tierGradient.top,
                },
              ]}
            >
              <View style={styles.innerPanel}>
                <Animated.View
                  style={[
                    styles.flashOverlay,
                    {
                      opacity: flashOpacity,
                      backgroundColor: usesSilhouetteAnticipation ? '#FFFFFF' : tierGradient.top,
                    },
                  ]}
                  pointerEvents="none"
                />

                <View style={styles.slimeStage}>
                  {usesSilhouetteAnticipation ? (
                    <>
                      <Animated.View
                        style={[
                          styles.slimeLayer,
                          {
                            opacity: silhouetteRevealOpacity,
                            transform: [
                              { translateY: bounceTranslateY },
                              { scaleX: bounceScaleX },
                              { scaleY: bounceScaleY },
                            ],
                          },
                        ]}
                      >
                        <SlimeSilhouetteArtwork
                          speciesId={speciesId}
                          style={styles.slimeArtwork}
                          imageStyle={styles.slimeImage}
                          resizeMode="contain"
                        />
                      </Animated.View>
                      {revealed ? (
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
                            speciesId={speciesId}
                            variant={slimeVariant}
                            foilMotion="full"
                            style={styles.slimeArtwork}
                            imageStyle={styles.slimeImage}
                            resizeMode="contain"
                          />
                        </Animated.View>
                      ) : null}
                    </>
                  ) : (
                    <SlimeArtwork
                      speciesId={speciesId}
                      variant={slimeVariant}
                      foilMotion="full"
                      style={styles.slimeArtwork}
                      imageStyle={styles.slimeImage}
                      resizeMode="contain"
                    />
                  )}

                  {!revealed && !usesSilhouetteAnticipation ? (
                    <Animated.View
                      style={[styles.revealCover, { opacity: coverOpacity }]}
                      pointerEvents="none"
                    >
                      {!isQuickReveal ? (
                        <Animated.View style={{ transform: [{ scale: questionMarkScale }] }}>
                          <Text
                            style={[
                              styles.questionMark,
                              { color: tierGradient.top },
                            ]}
                          >
                            ?
                          </Text>
                        </Animated.View>
                      ) : null}
                    </Animated.View>
                  ) : null}

                  {isNewSpecies ? (
                    <>
                      {newBadgeSparkleToken > 0 ? (
                        <View style={styles.newBadgeSparkleHost} pointerEvents="none">
                          <NewBadgeSparkleBurst
                            burstKey={newBadgeSparkleToken}
                            delayMs={0}
                          />
                        </View>
                      ) : null}
                      <View style={styles.newBadgeEffectHost} pointerEvents="none">
                        <Animated.View
                          style={[styles.newBadgeAnchor, { opacity: newBadgeOpacity }]}
                        >
                          <Text style={styles.newBadgeText}>New!</Text>
                        </Animated.View>
                      </View>
                    </>
                  ) : null}
                </View>

                <View style={styles.metaStack}>
                  <Animated.View style={{ opacity: metaOpacity, width: '100%', alignItems: 'center' }}>
                    <OutlinedSpeciesName text={speciesName} />
                  </Animated.View>
                  <Animated.View
                    style={{
                      opacity: usesSilhouetteAnticipation && !revealed ? 1 : metaOpacity,
                      width: '100%',
                      alignItems: 'center',
                    }}
                  >
                    <GradientTierText text={tierLabel} />
                  </Animated.View>
                  <Animated.View style={{ opacity: metaOpacity, width: '100%', alignItems: 'center' }}>
                    {showVariant && variantLabel && slimeVariant ? (
                      <GradientVariantText variant={slimeVariant} text={variantLabel} />
                    ) : null}
                  </Animated.View>
                </View>
              </View>
            </View>
          </Animated.View>
          </View>

          <Animated.View style={{ opacity: ctaOpacity }}>
            <Pressable
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
                !ctaReady && styles.ctaDisabled,
              ]}
              onPress={onPressCta}
              disabled={!ctaReady}
            >
              <Text style={styles.ctaText}>{ctaLabel}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>

      {showUltraRareAmbience ? (
        <UltraRareRevealAmbience
          effectKey={revealKey}
          revealed={revealed}
          anticipationMs={config.anticipationMs}
          slimeMaskOffsetY={bounceTranslateY}
        />
      ) : null}
    </View>
  );
}

type OutlinedStatsRowProps = {
  leftText: string;
  rightText: string;
};

function OutlinedStatsRow({ leftText, rightText }: OutlinedStatsRowProps) {
  const y = STATS_FONT_SIZE + 4;
  return (
    <View style={styles.statsRowSvgWrap}>
      <Svg width="100%" height={STATS_LINE_HEIGHT}>
        <SvgText
          x="0"
          y={y}
          textAnchor="start"
          fontFamily={APP_FONT_FAMILY}
          fontSize={STATS_FONT_SIZE}
          fontWeight="900"
          stroke={STATS_STROKE}
          strokeWidth={STATS_STROKE_WIDTH}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {leftText}
        </SvgText>
        <SvgText
          x="0"
          y={y}
          textAnchor="start"
          fontFamily={APP_FONT_FAMILY}
          fontSize={STATS_FONT_SIZE}
          fontWeight="900"
          fill={STATS_FILL}
        >
          {leftText}
        </SvgText>
        <SvgText
          x="100%"
          y={y}
          textAnchor="end"
          fontFamily={APP_FONT_FAMILY}
          fontSize={STATS_FONT_SIZE}
          fontWeight="900"
          stroke={STATS_STROKE}
          strokeWidth={STATS_STROKE_WIDTH}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {rightText}
        </SvgText>
        <SvgText
          x="100%"
          y={y}
          textAnchor="end"
          fontFamily={APP_FONT_FAMILY}
          fontSize={STATS_FONT_SIZE}
          fontWeight="900"
          fill={STATS_FILL}
        >
          {rightText}
        </SvgText>
      </Svg>
    </View>
  );
}

function OutlinedSpeciesName({ text }: { text: string }) {
  return (
    <OutlinedSvgLabel
      text={text}
      fit="sleepRevealSpeciesName"
      strokeColor={NAME_STROKE}
      fillColor={NAME_FILL}
      strokeWidth={NAME_STROKE_WIDTH}
      style={styles.speciesNameWrap}
      defaultWidth={280}
    />
  );
}

function GradientTierText({ text }: { text: string }) {
  const g = resolveTierGradientFromLabel(text);
  const gradientId = `tier-gradient-${text.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <View style={styles.tierLineWrap}>
      <Svg width="100%" height={42}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={g.top} />
            <Stop offset="100%" stopColor={g.bottom} />
          </LinearGradient>
        </Defs>
        <SvgText
          x="50%"
          y={34}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={30}
          fontWeight="900"
          fill={`url(#${gradientId})`}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
}

function GradientVariantText({
  variant,
  text,
}: {
  variant: SlimeVariantType;
  text: string;
}) {
  const accent = resolveVariantAccent(variant);
  const gradId = `reveal-variant-${useId().replace(/:/g, '')}`;

  if (!accent) {
    return (
      <Text style={styles.variantFallback} numberOfLines={1}>
        {text}
      </Text>
    );
  }

  return (
    <View style={styles.variantLineWrap}>
      <Svg width="100%" height={36}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {accent.stops.map((stop) => (
              <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </LinearGradient>
        </Defs>
        <SvgText
          x="50%"
          y={28}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={24}
          fontWeight="900"
          fill={`url(#${gradId})`}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = createAppStyles({
  root: {
    flex: 1,
    backgroundColor: t.bg,
    overflow: 'hidden',
  },
  fadeInner: {
    flex: 1,
    justifyContent: 'center',
  },
  centerColumn: {
    width: '100%',
    maxWidth: 410,
    alignSelf: 'center',
  },
  statsBlock: {
    zIndex: 3,
    marginBottom: 8,
  },
  statsRowSvgWrap: {
    width: '100%',
    minHeight: STATS_LINE_HEIGHT,
  },
  revealStage: {
    width: '100%',
    marginBottom: 4,
  },
  cardWrap: {
    width: '100%',
    zIndex: 2,
  },
  outerCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 6,
    backgroundColor: t.surface,
    padding: 28,
  },
  innerPanel: {
    height: '100%',
    borderRadius: 22,
    backgroundColor: t.innerPanel,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    overflow: 'visible',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    zIndex: 0,
  },
  slimeStage: {
    position: 'relative',
    width: 220,
    height: 220,
    marginBottom: -20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 2,
  },
  revealCover: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.innerPanel,
    borderRadius: 16,
    zIndex: 3,
  },
  questionMark: {
    fontSize: 120,
    fontWeight: '900',
    opacity: 0.55,
  },
  slimeLayer: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slimeArtwork: {
    width: 220,
    height: 220,
    borderRadius: 16,
  },
  slimeImage: {
    width: 220,
    height: 220,
  },
  newBadgeSparkleHost: {
    position: 'absolute',
    top: 18,
    right: 28,
    zIndex: 5,
    overflow: 'visible',
  },
  newBadgeEffectHost: {
    position: 'absolute',
    top: -14,
    right: -22,
    zIndex: 4,
    overflow: 'visible',
  },
  newBadgeAnchor: {
    transform: [{ rotate: '17deg' }],
  },
  newBadgeText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: NEW_BADGE_FILL,
    textShadowColor: NEW_BADGE_SHADOW,
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 1,
  },
  speciesNameWrap: {
    width: '100%',
    minHeight: NAME_LINE_HEIGHT,
    marginBottom: -12,
  },
  metaStack: {
    width: '100%',
    alignItems: 'center',
  },
  tierLineWrap: {
    width: '100%',
    minHeight: 42,
  },
  variantLineWrap: {
    width: '100%',
    minHeight: 36,
    marginTop: -4,
  },
  variantFallback: {
    fontSize: 24,
    fontWeight: '900',
    color: t.nameFill,
    marginTop: -4,
  },
  cta: {
    alignSelf: 'center',
    minWidth: 220,
    marginTop: 12,
    backgroundColor: t.surface,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 6,
    borderColor: t.revealCtaBorder,
  },
  ctaPressed: {
    backgroundColor: t.ctaPressed,
  },
  ctaDisabled: {
    opacity: 0.55,
  },
  ctaText: {
    color: t.revealCtaText,
    fontSize: 36,
    fontWeight: '800',
  },
});
