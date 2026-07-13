/**
 * Looping background music — respects Settings music toggle + volume.
 * Player lives on globalThis so Fast Refresh does not orphan instances.
 */

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { BACKGROUND_MUSIC } from '@/src/constants/backgroundMusicAssets';
import { ensureAppAudioMode } from '@/src/services/audioMode';
import { waitForAudioPlayerLoaded } from '@/src/services/audioPlayerUtils';
import { getMusicVolume, isMusicEnabled } from '@/src/stores/useSoundSettingsStore';

type BgmRuntime = {
  player: AudioPlayer | null;
  loading: Promise<AudioPlayer> | null;
  wasPlayingBeforePause: boolean;
  lastAppliedVolume: number;
  revealDucked: boolean;
};

const BGM_GLOBAL_KEY = '__sleepySlimesBgm__';
const REVEAL_DUCK_RATIO = 0.38;
const REVEAL_DUCK_IN_MS = 280;
const REVEAL_DUCK_OUT_MS = 480;
const REVEAL_DUCK_HOLD_MS = 1050;

let volumeFadeTimer: ReturnType<typeof setInterval> | null = null;
let revealDuckRestoreTimer: ReturnType<typeof setTimeout> | null = null;
let revealDuckGeneration = 0;

function getBgmRuntime(): BgmRuntime {
  const g = globalThis as typeof globalThis & { [BGM_GLOBAL_KEY]?: BgmRuntime };
  if (!g[BGM_GLOBAL_KEY]) {
    g[BGM_GLOBAL_KEY] = {
      player: null,
      loading: null,
      wasPlayingBeforePause: false,
      lastAppliedVolume: -1,
      revealDucked: false,
    };
  }
  return g[BGM_GLOBAL_KEY];
}

function resolvePlaybackVolume(runtime: BgmRuntime): number {
  const base = getMusicVolume();
  return runtime.revealDucked ? base * REVEAL_DUCK_RATIO : base;
}

function cancelVolumeFade(): void {
  if (volumeFadeTimer) {
    clearInterval(volumeFadeTimer);
    volumeFadeTimer = null;
  }
}

function cancelRevealDuckRestore(): void {
  if (revealDuckRestoreTimer) {
    clearTimeout(revealDuckRestoreTimer);
    revealDuckRestoreTimer = null;
  }
}

function fadePlayerVolume(
  runtime: BgmRuntime,
  player: AudioPlayer,
  toVolume: number,
  durationMs: number,
  onComplete?: () => void
): void {
  cancelVolumeFade();
  const fromVolume = player.volume;
  const startedAt = Date.now();

  volumeFadeTimer = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const t = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
    const nextVolume = fromVolume + (toVolume - fromVolume) * t;

    try {
      player.volume = nextVolume;
      runtime.lastAppliedVolume = nextVolume;
    } catch {
      cancelVolumeFade();
      return;
    }

    if (t >= 1) {
      cancelVolumeFade();
      onComplete?.();
    }
  }, 16);
}

function scheduleRevealDuckRestore(generation: number): void {
  cancelRevealDuckRestore();
  revealDuckRestoreTimer = setTimeout(() => {
    if (generation !== revealDuckGeneration) return;
    void restoreBackgroundMusicAfterRevealDuck();
  }, REVEAL_DUCK_HOLD_MS);
}

async function restoreBackgroundMusicAfterRevealDuck(): Promise<void> {
  return enqueueSync(async () => {
    const runtime = getBgmRuntime();
    const player = runtime.player;
    if (!runtime.revealDucked || !player?.isLoaded || !player.playing) {
      runtime.revealDucked = false;
      return;
    }

    const target = getMusicVolume();
    runtime.revealDucked = false;
    fadePlayerVolume(runtime, player, target, REVEAL_DUCK_OUT_MS);
  });
}

/** Duck looping BGM while a reveal SFX plays, then fade back. */
export function duckBackgroundMusicForReveal(): void {
  if (!isMusicEnabled() || getMusicVolume() <= 0) return;

  const generation = ++revealDuckGeneration;

  void enqueueSync(async () => {
    try {
      const runtime = getBgmRuntime();
      const player = await ensureBackgroundMusicLoaded();
      if (!player.playing) return;

      const duckedVolume = getMusicVolume() * REVEAL_DUCK_RATIO;
      runtime.revealDucked = true;

      if (runtime.lastAppliedVolume !== duckedVolume) {
        fadePlayerVolume(runtime, player, duckedVolume, REVEAL_DUCK_IN_MS);
      }

      scheduleRevealDuckRestore(generation);
    } catch (e) {
      console.warn('duckBackgroundMusicForReveal failed', e);
    }
  });
}

let syncQueue: Promise<void> = Promise.resolve();

function destroyPlayer(player: AudioPlayer): void {
  try {
    player.pause();
    player.remove();
  } catch {
    // ignore
  }
}

async function ensureBackgroundMusicLoaded(): Promise<AudioPlayer> {
  const runtime = getBgmRuntime();

  if (runtime.player?.isLoaded) {
    return runtime.player;
  }

  if (runtime.player) {
    destroyPlayer(runtime.player);
    runtime.player = null;
    runtime.lastAppliedVolume = -1;
  }

  if (runtime.loading) {
    return runtime.loading;
  }

  runtime.loading = (async () => {
    await ensureAppAudioMode();
    const player = createAudioPlayer(BACKGROUND_MUSIC, { keepAudioSessionActive: true });
    player.loop = true;
    player.volume = 0;
    await waitForAudioPlayerLoaded(player);
    runtime.player = player;
    runtime.loading = null;
    runtime.lastAppliedVolume = -1;
    return player;
  })();

  try {
    return await runtime.loading;
  } catch (e) {
    runtime.loading = null;
    throw e;
  }
}

function applyVolume(runtime: BgmRuntime, player: AudioPlayer, volume: number): void {
  if (volume === runtime.lastAppliedVolume) return;
  player.volume = volume;
  runtime.lastAppliedVolume = volume;
}

function enqueueSync(fn: () => Promise<void>): Promise<void> {
  syncQueue = syncQueue.then(fn, fn);
  return syncQueue;
}

export async function preloadBackgroundMusic(): Promise<void> {
  try {
    await ensureBackgroundMusicLoaded();
  } catch (e) {
    console.warn('preloadBackgroundMusic failed', e);
  }
}

export async function setBackgroundMusicVolume(): Promise<void> {
  return enqueueSync(async () => {
    const runtime = getBgmRuntime();
    if (!runtime.player?.isLoaded) return;
    try {
      applyVolume(runtime, runtime.player, resolvePlaybackVolume(runtime));
    } catch (e) {
      console.warn('setBackgroundMusicVolume failed', e);
    }
  });
}

export async function syncBackgroundMusic(shouldPlay: boolean): Promise<void> {
  return enqueueSync(async () => {
    const runtime = getBgmRuntime();
    try {
      const player = await ensureBackgroundMusicLoaded();
      const volume = resolvePlaybackVolume(runtime);
      const wantPlay = shouldPlay && isMusicEnabled() && getMusicVolume() > 0;

      if (wantPlay) {
        applyVolume(runtime, player, volume);
        if (!player.playing) {
          player.play();
        }
        runtime.wasPlayingBeforePause = true;
        return;
      }

      if (player.playing) {
        player.pause();
      }
      if (!shouldPlay) {
        runtime.wasPlayingBeforePause = false;
      }
    } catch (e) {
      console.warn('syncBackgroundMusic failed', e);
    }
  });
}

export async function pauseBackgroundMusic(): Promise<void> {
  return enqueueSync(async () => {
    const runtime = getBgmRuntime();
    if (!runtime.player?.isLoaded) return;
    try {
      if (runtime.player.playing) {
        runtime.wasPlayingBeforePause = true;
        runtime.player.pause();
      }
    } catch (e) {
      console.warn('pauseBackgroundMusic failed', e);
    }
  });
}

export async function resumeBackgroundMusicIfNeeded(shouldPlay: boolean): Promise<void> {
  const runtime = getBgmRuntime();
  if (!runtime.wasPlayingBeforePause || !shouldPlay) return;
  await syncBackgroundMusic(true);
}

export async function unloadBackgroundMusic(): Promise<void> {
  return enqueueSync(async () => {
    cancelVolumeFade();
    cancelRevealDuckRestore();
    revealDuckGeneration += 1;
    const runtime = getBgmRuntime();
    if (!runtime.player) return;
    const player = runtime.player;
    runtime.player = null;
    runtime.loading = null;
    runtime.wasPlayingBeforePause = false;
    runtime.lastAppliedVolume = -1;
    runtime.revealDucked = false;
    destroyPlayer(player);
  });
}
