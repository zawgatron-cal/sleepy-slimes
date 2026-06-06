/**
 * Looping background music — respects Settings music toggle + volume.
 */

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { BACKGROUND_MUSIC } from '@/src/constants/backgroundMusicAssets';
import { getMusicVolume, isMusicEnabled } from '@/src/stores/useSoundSettingsStore';

let bgSound: Audio.Sound | null = null;
let loadingSound: Promise<Audio.Sound> | null = null;
let audioModeReady = false;
/** Paused for alarm / sleep flow; resume only if this was true before pause. */
let wasPlayingBeforePause = false;
/** Avoid overlapping sync calls racing on playAsync. */
let syncQueue: Promise<void> = Promise.resolve();
/** Last volume applied to the loaded sound (skip redundant setVolumeAsync). */
let lastAppliedVolume = -1;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    playThroughEarpieceAndroid: false,
  });
  audioModeReady = true;
}

async function ensureBackgroundMusicLoaded(): Promise<Audio.Sound> {
  if (bgSound) return bgSound;
  if (loadingSound) return loadingSound;

  loadingSound = (async () => {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(
      BACKGROUND_MUSIC,
      { shouldPlay: false, isLooping: true, volume: 0 },
      null,
      true
    );
    bgSound = sound;
    loadingSound = null;
    lastAppliedVolume = -1;
    return sound;
  })();

  try {
    return await loadingSound;
  } catch (e) {
    loadingSound = null;
    throw e;
  }
}

async function applyVolume(sound: Audio.Sound, volume: number): Promise<void> {
  if (volume === lastAppliedVolume) return;
  await sound.setVolumeAsync(volume);
  lastAppliedVolume = volume;
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
  if (!bgSound) return;
  try {
    const volume = getMusicVolume();
    const status = await bgSound.getStatusAsync();
    if (!status.isLoaded) return;
    await applyVolume(bgSound, volume);
  } catch (e) {
    console.warn('setBackgroundMusicVolume failed', e);
  }
}

export async function syncBackgroundMusic(shouldPlay: boolean): Promise<void> {
  return enqueueSync(async () => {
    try {
      const sound = await ensureBackgroundMusicLoaded();
      const volume = getMusicVolume();
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;

      const wantPlay = shouldPlay && isMusicEnabled() && volume > 0;

      if (wantPlay) {
        await applyVolume(sound, volume);
        if (!status.isPlaying) {
          await sound.playAsync();
        }
        wasPlayingBeforePause = true;
        return;
      }

      if (status.isPlaying) {
        await sound.pauseAsync();
      }
      if (!shouldPlay) {
        wasPlayingBeforePause = false;
      }
    } catch (e) {
      console.warn('syncBackgroundMusic failed', e);
    }
  });
}

/** Temporarily pause (alarm, etc.) without clearing wasPlayingBeforePause. */
export async function pauseBackgroundMusic(): Promise<void> {
  if (!bgSound) return;
  return enqueueSync(async () => {
    try {
      const status = await bgSound!.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        wasPlayingBeforePause = true;
        await bgSound!.pauseAsync();
      }
    } catch (e) {
      console.warn('pauseBackgroundMusic failed', e);
    }
  });
}

export async function resumeBackgroundMusicIfNeeded(shouldPlay: boolean): Promise<void> {
  if (!wasPlayingBeforePause || !shouldPlay) return;
  await syncBackgroundMusic(true);
}

export async function unloadBackgroundMusic(): Promise<void> {
  return enqueueSync(async () => {
    if (!bgSound) return;
    const sound = bgSound;
    bgSound = null;
    loadingSound = null;
    wasPlayingBeforePause = false;
    lastAppliedVolume = -1;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (_) {
      // ignore if already unloaded
    }
  });
}
