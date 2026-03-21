/**
 * While `phase === 'tracking'`: tick wall clock every second (for alarm comparisons)
 * and animate the "Tracking Sleep..." ellipsis.
 */

import { useEffect, useState } from 'react';
import type { SleepPhase } from '@/src/stores/useSleepStore';

export function useTrackingPhaseUI(phase: SleepPhase): {
  currentTime: number;
  trackingDots: string;
} {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [trackingDots, setTrackingDots] = useState('');

  useEffect(() => {
    if (phase !== 'tracking') return;
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'tracking') {
      setTrackingDots('');
      return;
    }
    const frames = ['', '.', '..', '...'];
    let i = 0;
    setTrackingDots(frames[i]);
    const t = setInterval(() => {
      i = (i + 1) % frames.length;
      setTrackingDots(frames[i]);
    }, 800);
    return () => clearInterval(t);
  }, [phase]);

  return { currentTime, trackingDots };
}
