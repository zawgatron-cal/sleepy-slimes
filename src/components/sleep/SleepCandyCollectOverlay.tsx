/**
 * Candy collect particles — scrim is layered in header, screen body, and tab bar overlay.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
const PARTICLE_MAX = 12;
const SPAWN_STAGGER_MS = 85;
const FLIGHT_MS = 580;
const FINISH_HOLD_MS = 750;
const EXIT_FADE_MS = 520;
const MAX_COLLECT_MS =
  FINISH_HOLD_MS +
  EXIT_FADE_MS +
  FLIGHT_MS +
  PARTICLE_MAX * SPAWN_STAGGER_MS +
  600;

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
  candyDelta: number;
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

function distributeCandies(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  let remainder = total % count;
  return Array.from({ length: count }, () => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return base + extra;
  });
}

function resolveParticleCount(candiesEarned: number): number {
  if (candiesEarned <= 0) return 0;
  return Math.min(PARTICLE_MAX, candiesEarned);
}

function buildParticles(
  candiesEarned: number,
  spawnCenter: { x: number; y: number },
  sessionId: number
): ParticleSpec[] {
  const particleCount = resolveParticleCount(candiesEarned);
  if (particleCount === 0) return [];

  const candyDeltas = distributeCandies(candiesEarned, particleCount);
  const spawnSpread = 36;

  return Array.from({ length: particleCount }, (_, index) => {
    const arcSign = index % 2 === 0 ? -1 : 1;
    const arcOffset = arcSign * (72 + (index % 4) * 28);

    return {
      id: sessionId * 100 + index,
      startX:
        spawnCenter.x +
        (((index * 17 + sessionId * 3) % 100) / 100 - 0.5) * spawnSpread,
      startY:
        spawnCenter.y +
        (((index * 31 + sessionId * 5) % 100) / 100 - 0.5) * spawnSpread,
      candyDelta: candyDeltas[index] ?? 0,
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

  const startOffsetX = spec.startX - target.x;
  const startOffsetY = spec.startY - target.y;
  const arcPath = buildArcInterpolation(startOffsetX, startOffsetY, spec.arcOffset);

  useEffect(() => {
    onArriveRef.current = onArrive;
  }, [onArrive]);

  useEffect(() => {
    arrivedRef.current = false;
    progress.stopAnimation();
    progress.setValue(0);

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: FLIGHT_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (!finished || arrivedRef.current) return;
      arrivedRef.current = true;
      onArriveRef.current(spec.candyDelta);
    });

    return () => anim.stop();
  }, [progress, spec.candyDelta, spec.id]);

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
  const [particles, setParticles] = useState<ParticleSpec[]>([]);
  const [spawnedCount, setSpawnedCount] = useState(0);
  const arrivedRef = useRef(0);
  const exitingRef = useRef(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flightSessionRef = useRef(0);
  const particleCountRef = useRef(0);
  const layoutReadyRef = useRef(false);
  const flightStartedRef = useRef(false);

  useEffect(() => {
    startCountRef.current = startCount;
    totalRef.current = total;
  }, [startCount, total]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishAndExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;

    if (spawnTimerRef.current) {
      clearTimeout(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
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

  const beginFlight = useCallback(
    (pillTarget: { x: number; y: number }, spawnCenter: { x: number; y: number }) => {
      if (flightStartedRef.current) return;
      flightStartedRef.current = true;

      flightSessionRef.current += 1;
      const sessionId = flightSessionRef.current;
      const nextParticles = buildParticles(candiesEarned, spawnCenter, sessionId);

      setTarget(pillTarget);
      setParticles(nextParticles);
      particleCountRef.current = nextParticles.length;
      setSpawnedCount(0);
      arrivedRef.current = 0;

      if (nextParticles.length === 0) {
        finishAndExit();
        return;
      }

      let spawned = 0;
      const scheduleNextSpawn = () => {
        spawned += 1;
        setSpawnedCount(spawned);
        if (spawned >= nextParticles.length) return;
        spawnTimerRef.current = setTimeout(scheduleNextSpawn, SPAWN_STAGGER_MS);
      };
      scheduleNextSpawn();
    },
    [candiesEarned, finishAndExit]
  );

  const syncLayout = useCallback(() => {
    if (!visible || !targetRect || layoutReadyRef.current || flightStartedRef.current) {
      return;
    }

    rootRef.current?.measureInWindow((ox, oy, rootWidth, rootHeight) => {
      if (
        !visible ||
        layoutReadyRef.current ||
        flightStartedRef.current ||
        rootWidth < 1 ||
        rootHeight < 1
      ) {
        return;
      }

      layoutReadyRef.current = true;
      const glyph = glyphCenterFromPillRect(targetRect);
      beginFlight(
        {
          x: glyph.x - ox - PARTICLE_GLYPH / 2,
          y: glyph.y - oy - PARTICLE_GLYPH / 2,
        },
        {
          x: windowWidth / 2 - ox,
          y: windowHeight / 2 - oy,
        }
      );
    });
  }, [beginFlight, targetRect, visible, windowHeight, windowWidth]);

  useEffect(() => {
    if (!visible) {
      setTarget(null);
      setParticles([]);
      setSpawnedCount(0);
      arrivedRef.current = 0;
      exitingRef.current = false;
      layoutReadyRef.current = false;
      flightStartedRef.current = false;
      candyCollectScrimOpacity.setValue(0);
      useCandyCollectStore.getState().reset();

      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
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
    layoutReadyRef.current = false;
    flightStartedRef.current = false;
    useCandyCollectStore.getState().begin(startCountRef.current);

    Animated.timing(candyCollectScrimOpacity, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    safetyTimerRef.current = setTimeout(() => {
      if (!exitingRef.current) {
        useCandyCollectStore.getState().setDisplayCount(totalRef.current);
        finishAndExit();
      }
    }, MAX_COLLECT_MS);

    return () => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };
  }, [finishAndExit, visible]);

  useEffect(() => {
    if (!visible) return;
    syncLayout();
  }, [syncLayout, targetRect, visible]);

  if (!visible) return null;

  const activeParticles = particles.slice(0, spawnedCount);

  return (
    <View
      ref={rootRef}
      style={styles.root}
      pointerEvents="box-none"
      onLayout={syncLayout}
    >
      {target
        ? activeParticles.map((spec) => (
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
