/**
 * Candy collect particles — scrim is layered in header, screen body, and tab bar overlay.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { CANDY_HEADER_GLYPH_SIZE } from '@/src/components/CandyCounterPill';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { useCandiesStore, useCandyCollectStore } from '@/src/stores';
import type { CandyPillWindowRect } from '@/src/stores/useCandyCollectStore';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { candyCollectScrimOpacity } from './candyCollectScrimOpacity';

const PARTICLE_GLYPH = 50;
const PARTICLE_MIN = 6;
const PARTICLE_MAX = 14;
const SPAWN_STAGGER_MS = 70;
const FLIGHT_MS = 620;
const FINISH_HOLD_MS = 750;
const EXIT_FADE_MS = 520;
const MAX_COLLECT_MS =
  FINISH_HOLD_MS + EXIT_FADE_MS + FLIGHT_MS + PARTICLE_MAX * SPAWN_STAGGER_MS + 800;

function glyphCenterFromPillRect(rect: CandyPillWindowRect) {
  return {
    x: rect.x + CANDY_HEADER_GLYPH_SIZE / 2,
    y: rect.y + rect.height / 2,
  };
}

export type SleepCandyCollectOverlayProps = {
  visible: boolean;
  candiesEarned: number;
  onComplete: () => void;
};

type ParticleSpec = {
  id: number;
  startX: number;
  startY: number;
  delayMs: number;
  candyDelta: number;
  /** Lateral bezier bend — signed pixels perpendicular to the flight path. */
  arcOffset: number;
};

function buildArcInterpolation(
  startOffsetX: number,
  startOffsetY: number,
  arcOffset: number,
  samples = 13
) {
  const midX = startOffsetX * 0.5;
  const midY = startOffsetY * 0.5;
  const dirX = -startOffsetX;
  const dirY = -startOffsetY;
  const len = Math.hypot(dirX, dirY) || 1;
  const controlX = midX + (-dirY / len) * arcOffset;
  const controlY = midY + (dirX / len) * arcOffset;

  const inputRange: number[] = [];
  const outputX: number[] = [];
  const outputY: number[] = [];

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const u = 1 - t;
    inputRange.push(t);
    outputX.push(u * u * startOffsetX + 2 * u * t * controlX);
    outputY.push(u * u * startOffsetY + 2 * u * t * controlY);
  }

  return { inputRange, outputX, outputY };
}

function buildParticles(
  candiesEarned: number,
  spawnCenter: { x: number; y: number }
): ParticleSpec[] {
  const particleCount = Math.min(
    PARTICLE_MAX,
    Math.max(PARTICLE_MIN, candiesEarned > 0 ? Math.ceil(candiesEarned / 2) : 8)
  );
  const base = candiesEarned > 0 ? Math.floor(candiesEarned / particleCount) : 0;
  const remainder = candiesEarned > 0 ? candiesEarned % particleCount : 0;
  const spawnSpread = 40;

  return Array.from({ length: particleCount }, (_, i) => {
    const arcSign = Math.random() < 0.5 ? -1 : 1;
    const arcOffset = arcSign * (66 + Math.random() * 136);

    return {
      id: i,
      startX: spawnCenter.x + (Math.random() - 0.5) * spawnSpread,
      startY: spawnCenter.y + (Math.random() - 0.5) * spawnSpread,
      delayMs: i * SPAWN_STAGGER_MS,
      candyDelta: base + (i < remainder ? 1 : 0),
      arcOffset,
    };
  });
}

type FlyingCandyProps = {
  spec: ParticleSpec;
  target: { x: number; y: number };
  onArrive: (delta: number) => void;
};

function FlyingCandy({ spec, target, onArrive }: FlyingCandyProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const onArriveRef = useRef(onArrive);
  const arrivedRef = useRef(false);

  const arcPath = useMemo(() => {
    const startOffsetX = spec.startX - target.x;
    const startOffsetY = spec.startY - target.y;
    return buildArcInterpolation(startOffsetX, startOffsetY, spec.arcOffset);
  }, [spec.arcOffset, spec.startX, spec.startY, target.x, target.y]);

  useEffect(() => {
    onArriveRef.current = onArrive;
  }, [onArrive]);

  useEffect(() => {
    arrivedRef.current = false;
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: FLIGHT_MS,
      delay: spec.delayMs,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (!finished || arrivedRef.current) return;
      arrivedRef.current = true;
      onArriveRef.current(spec.candyDelta);
    });
    return () => anim.stop();
  }, [progress, spec.candyDelta, spec.delayMs, spec.id]);

  const translateX = progress.interpolate({
    inputRange: arcPath.inputRange,
    outputRange: arcPath.outputX,
  });
  const translateY = progress.interpolate({
    inputRange: arcPath.inputRange,
    outputRange: arcPath.outputY,
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.12, 0.88, 1],
    outputRange: [0.5, 1, 1.06, 0.42],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.06, 0.92, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: target.x,
          top: target.y,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <CandyGlyph size={PARTICLE_GLYPH} />
    </Animated.View>
  );
}

export function SleepCandyCollectOverlay({
  visible,
  candiesEarned,
  onComplete,
}: SleepCandyCollectOverlayProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const total = useCandiesStore((s) => s.total);
  const targetRect = useCandyCollectStore((s) => s.targetRect);
  const startCount = total - candiesEarned;

  const onCompleteRef = useRef(onComplete);
  const rootRef = useRef<View>(null);
  const startCountRef = useRef(startCount);
  const totalRef = useRef(total);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [spawnCenter, setSpawnCenter] = useState<{ x: number; y: number } | null>(null);
  const [particlesStarted, setParticlesStarted] = useState(false);
  const arrivedRef = useRef(0);
  const exitingRef = useRef(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particleCountRef = useRef(0);
  const layoutLockedRef = useRef(false);

  useEffect(() => {
    startCountRef.current = startCount;
    totalRef.current = total;
  }, [startCount, total]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const particles = useMemo(
    () =>
      particlesStarted && spawnCenter
        ? buildParticles(candiesEarned, spawnCenter)
        : [],
    [candiesEarned, particlesStarted, spawnCenter]
  );
  particleCountRef.current = particles.length;

  const syncLayout = useCallback(() => {
    if (!targetRect) return;
    const glyph = glyphCenterFromPillRect(targetRect);
    rootRef.current?.measureInWindow((ox, oy) => {
      if (layoutLockedRef.current) return;
      layoutLockedRef.current = true;
      setTarget({
        x: glyph.x - ox - PARTICLE_GLYPH / 2,
        y: glyph.y - oy - PARTICLE_GLYPH / 2,
      });
      setSpawnCenter({
        x: windowWidth / 2 - ox,
        y: windowHeight / 2 - oy,
      });
    });
  }, [targetRect, windowHeight, windowWidth]);

  const syncLayoutRef = useRef(syncLayout);
  useEffect(() => {
    syncLayoutRef.current = syncLayout;
  }, [syncLayout]);

  const finishAndExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;

    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    finishTimerRef.current = setTimeout(() => {
      finishTimerRef.current = null;
      Animated.timing(candyCollectScrimOpacity, {
        toValue: 0,
        duration: EXIT_FADE_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        candyCollectScrimOpacity.setValue(0);
        useCandyCollectStore.getState().reset();
        onCompleteRef.current();
      });
    }, FINISH_HOLD_MS);
  }, []);

  const handleArriveRef = useRef<(delta: number) => void>(() => {});

  handleArriveRef.current = (delta: number) => {
    arrivedRef.current += 1;
    const store = useCandyCollectStore.getState();
    if (delta > 0) {
      const current = store.displayCount ?? startCountRef.current;
      store.setDisplayCount(current + delta);
      store.pulse();
    }

    if (arrivedRef.current >= particleCountRef.current) {
      store.setDisplayCount(totalRef.current);
      finishAndExit();
    }
  };

  const handleArrive = useCallback((delta: number) => {
    handleArriveRef.current(delta);
  }, []);

  useEffect(() => {
    if (!visible) {
      setParticlesStarted(false);
      setTarget(null);
      setSpawnCenter(null);
      arrivedRef.current = 0;
      exitingRef.current = false;
      layoutLockedRef.current = false;
      candyCollectScrimOpacity.setValue(0);
      useCandyCollectStore.getState().reset();
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      return;
    }

    arrivedRef.current = 0;
    exitingRef.current = false;
    layoutLockedRef.current = false;
    useCandyCollectStore.getState().begin(startCountRef.current);

    Animated.timing(candyCollectScrimOpacity, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const measureTimer = setTimeout(() => {
      syncLayoutRef.current();
      setParticlesStarted(true);
    }, 120);

    const retryMeasureTimer = setTimeout(() => syncLayoutRef.current(), 280);

    safetyTimerRef.current = setTimeout(() => {
      if (!exitingRef.current) {
        useCandyCollectStore.getState().setDisplayCount(totalRef.current);
        finishAndExit();
      }
    }, MAX_COLLECT_MS);

    return () => {
      clearTimeout(measureTimer);
      clearTimeout(retryMeasureTimer);
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };
  }, [finishAndExit, visible]);

  useEffect(() => {
    if (!visible || !particlesStarted || layoutLockedRef.current) return;
    syncLayoutRef.current();
  }, [particlesStarted, targetRect, visible]);

  if (!visible) return null;

  return (
    <View
      ref={rootRef}
      style={styles.root}
      pointerEvents="box-none"
      onLayout={() => syncLayoutRef.current()}
    >
      {target && particlesStarted
        ? particles.map((spec) => (
            <FlyingCandy
              key={spec.id}
              spec={spec}
              target={target}
              onArrive={handleArrive}
            />
          ))
        : null}
    </View>
  );
}

const styles = createAppStyles({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    overflow: 'visible',
  },
  particle: {
    position: 'absolute',
  },
});
