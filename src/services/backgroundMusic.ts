/**
 * Looping background music — respects Settings music toggle + volume.
 * Sound handle lives on globalThis so Fast Refresh does not orphan playing instances.
 */

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import { BACKGROUND_MUSIC } from '@/src/constants/backgroundMusicAssets';
import { getMusicVolume, isMusicEnabled } from '@/src/stores/useSoundSettingsStore';

type BgmRuntime = {
  sound: Audio.Sound | null;
  loading: Promise<Audio.Sound> | null;
  audioModeReady: boolean;
  wasPlayingBeforePause: boolean;
  lastAppliedVolume: number;
  playbackActive: boolean;
};

const BGM_GLOBAL_KEY = '__sleepySlimesBgm__';

function getBgmRuntime(): BgmRuntime {
  const g = globalThis as typeof globalThis & { [BGM_GLOBAL_KEY]?: BgmRuntime };
  if (!g[BGM_GLOBAL_KEY]) {
    g[BGM_GLOBAL_KEY] = {
      sound: null,
      loading: null,
      audioModeReady: false,
      wasPlayingBeforePause: false,
      lastAppliedVolume: -1,
      playbackActive: false,
    };
  }
  return g[BGM_GLOBAL_KEY];
}

/** Avoid overlapping sync / volume calls racing on playAsync. */
let syncQueue: Promise<void> = Promise.resolve();

async function ensureAudioMode(runtime: BgmRuntime): Promise<void> {
  if (runtime.audioModeReady) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    playThroughEarpieceAndroid: false,
  });
  runtime.audioModeReady = true;
}

async function destroySound(sound: Audio.Sound): Promise<void> {
  try {
    const status = await sound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await sound.stopAsync();
    }
  } catch {
    // ignore
  }
  try {
    await sound.unloadAsync();
  } catch {
    // ignore
  }
}

function attachPlaybackGuard(runtime: BgmRuntime, sound: Audio.Sound): void {
  sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      runtime.playbackActive = false;
      return;
    }
    runtime.playbackActive = status.isPlaying;
  });
}

async function ensureBackgroundMusicLoaded(): Promise<Audio.Sound> {
  const runtime = getBgmRuntime();

  if (runtime.sound) {
    try {
      const status = await runtime.sound.getStatusAsync();
      if (status.isLoaded) {
        return runtime.sound;
      }
    } catch {
      // fall through — stale native handle
    }
    await destroySound(runtime.sound);
    runtime.sound = null;
    runtime.playbackActive = false;
    runtime.lastAppliedVolume = -1;
  }

  if (runtime.loading) {
    return runtime.loading;
  }

  runtime.loading = (async () => {
    await ensureAudioMode(runtime);
    const { sound } = await Audio.Sound.createAsync(
      BACKGROUND_MUSIC,
      { shouldPlay: false, isLooping: true, volume: 0 },
      null,
      true
    );
    attachPlaybackGuard(runtime, sound);
    runtime.sound = sound;
    runtime.loading = null;
    runtime.lastAppliedVolume = -1;
    runtime.playbackActive = false;
    return sound;
  })();

  try {
    return await runtime.loading;
  } catch (e) {
    runtime.loading = null;
    throw e;
  }
}

async function applyVolume(runtime: BgmRuntime, sound: Audio.Sound, volume: number): Promise<void> {
  if (volume === runtime.lastAppliedVolume) return;
  await sound.setVolumeAsync(volume);
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

/** Volume-only update — does not start/stop playback (safe during slider drags). */
export async function setBackgroundMusicVolume(): Promise<void> {
  return enqueueSync(async () => {
    const runtime = getBgmRuntime();
    if (!runtime.sound) return;
    try {
      const volume = getMusicVolume();
      const status = await runtime.sound.getStatusAsync();
      if (!status.isLoaded) return;
      await applyVolume(runtime, runtime.sound, volume);
    } catch (e) {
      console.warn('setBackgroundMusicVolume failed', e);
    }
  });
}

export async function syncBackgroundMusic(shouldPlay: boolean): Promise<void> {
  return enqueueSync(async () => {
    const runtime = getBgmRuntime();
    try {
      const sound = await ensureBackgroundMusicLoaded();
      const volume = getMusicVolume();
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;

      const wantPlay = shouldPlay && isMusicEnabled() && volume > 0;

      if (wantPlay) {
        await applyVolume(runtime, sound, volume);
        if (!status.isPlaying && !runtime.playbackActive) {
          await sound.playAsync();
          runtime.playbackActive = true;
        }
        runtime.wasPlayingBeforePause = true;
        return;
      }

      if (status.isPlaying || runtime.playbackActive) {
        await sound.pauseAsync();
        runtime.playbackActive = false;
      }
      if (!shouldPlay) {
        runtime.wasPlayingBeforePause = false;
      }
    } catch (e) {
      console.warn('syncBackgroundMusic failed', e);
    }
  });
}

/** Temporarily pause (alarm, etc.) without clearing wasPlayingBeforePause. */
export async function pauseBackgroundMusic(): Promise<void> {
  return enqueueSync(async () => {
    const runtime = getBgmRuntime();
    if (!runtime.sound) return;
    try {
      const status = await runtime.sound.getStatusAsync();
      if (status.isLoaded && (status.isPlaying || runtime.playbackActive)) {
        runtime.wasPlayingBeforePause = true;
        await runtime.sound.pauseAsync();
        runtime.playbackActive = false;
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
    const runtime = getBgmRuntime();
    if (!runtime.sound) return;
    const sound = runtime.sound;
    runtime.sound = null;
    runtime.loading = null;
    runtime.wasPlayingBeforePause = false;
    runtime.playbackActive = false;
    runtime.lastAppliedVolume = -1;
    try {
      await destroySound(sound);
    } catch {
      // ignore
    }
  });
}
