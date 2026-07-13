/**
 * One-shot SFX — respects Settings SFX toggle + volume.
 */

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import {
  SOUND_EFFECTS,
  SOUND_EFFECT_GAIN,
  SOUND_EFFECT_START_SEC,
  type SoundEffectId,
} from '@/src/constants/soundEffectAssets';
import { duckBackgroundMusicForReveal } from '@/src/services/backgroundMusic';
import { ensureAppAudioMode } from '@/src/services/audioMode';
import { waitForAudioPlayerLoaded } from '@/src/services/audioPlayerUtils';
import { getSfxVolume, isSfxEnabled } from '@/src/stores/useSoundSettingsStore';

const POOL_SIZE = 4;
const RAPID_SFX_POOL_SIZE = 12;
const TAP_DEBOUNCE_MS = 48;

const RAPID_SFX_IDS = new Set<SoundEffectId>(['candy_clink', 'collection_pop']);

function maxPoolFor(id: SoundEffectId): number {
  return RAPID_SFX_IDS.has(id) ? RAPID_SFX_POOL_SIZE : POOL_SIZE;
}

const pools = new Map<SoundEffectId, AudioPlayer[]>();
let lastTapAt = 0;

function resolveVolume(id: SoundEffectId): number {
  if (!isSfxEnabled()) return 0;
  const base = getSfxVolume();
  if (base <= 0) return 0;
  return base * (SOUND_EFFECT_GAIN[id] ?? 1);
}

function acquirePlayer(id: SoundEffectId, maxPool = POOL_SIZE): AudioPlayer {
  const source = SOUND_EFFECTS[id];
  let pool = pools.get(id);
  if (!pool) {
    pool = [];
    pools.set(id, pool);
  }

  const idle = pool.find((player) => !player.playing);
  if (idle) return idle;

  if (pool.length < maxPool) {
    const player = createAudioPlayer(source, { keepAudioSessionActive: true });
    pool.push(player);
    return player;
  }

  return pool[pool.length % maxPool];
}

function startPlayer(player: AudioPlayer, volume: number, startSec: number): void {
  player.volume = volume;
  player.loop = false;
  try {
    void player.seekTo(startSec);
  } catch {
    // seek can fail before first load — play still works
  }
  player.play();
}

async function playInternal(id: SoundEffectId): Promise<void> {
  const volume = resolveVolume(id);
  if (volume <= 0) return;

  await ensureAppAudioMode();
  const maxPool = maxPoolFor(id);
  const player = acquirePlayer(id, maxPool);
  await waitForAudioPlayerLoaded(player, 3000);
  startPlayer(player, volume, SOUND_EFFECT_START_SEC[id] ?? 0);
}

/** Fire-and-forget SFX playback. */
export function playSoundEffect(id: SoundEffectId): void {
  void playInternal(id).catch((e) => {
    console.warn(`playSoundEffect(${id}) failed`, e);
  });
}

/** Debounced tap — safe for rapid UI presses. */
export function playUiTap(): void {
  const now = Date.now();
  if (now - lastTapAt < TAP_DEBOUNCE_MS) return;
  lastTapAt = now;
  playSoundEffect('ui_tap');
}

export function playUiSuccess(): void {
  playSoundEffect('ui_success');
}

export function playUiError(): void {
  playSoundEffect('ui_error');
}

export function playReveal(): void {
  duckBackgroundMusicForReveal();
  playSoundEffect('reveal');
}

function playPooledSfx(id: SoundEffectId): void {
  const volume = resolveVolume(id);
  if (volume <= 0) return;

  void ensureAppAudioMode();
  const player = acquirePlayer(id, maxPoolFor(id));
  if (player.isLoaded) {
    startPlayer(player, volume, SOUND_EFFECT_START_SEC[id] ?? 0);
    return;
  }

  playSoundEffect(id);
}

export function playCandyClink(): void {
  playPooledSfx('candy_clink');
}

export function playCollectionPop(): void {
  playPooledSfx('collection_pop');
}

export function playVariantTwinkle(): void {
  playSoundEffect('variant_twinkle');
}

/** Warm SFX pools at startup — expo-audio SDK 54 has no preload(). */
export async function preloadSoundEffects(): Promise<void> {
  try {
    await ensureAppAudioMode();
    await Promise.all(
      (Object.keys(SOUND_EFFECTS) as SoundEffectId[]).map(async (id) => {
        const maxPool = maxPoolFor(id);
        const warmCount = RAPID_SFX_IDS.has(id) ? RAPID_SFX_POOL_SIZE : 1;
        for (let i = 0; i < warmCount; i += 1) {
          const player = acquirePlayer(id, maxPool);
          await waitForAudioPlayerLoaded(player, 5000);
        }
      })
    );
  } catch (e) {
    console.warn('preloadSoundEffects failed', e);
  }
}

export async function unloadSoundEffects(): Promise<void> {
  for (const pool of pools.values()) {
    for (const player of pool) {
      try {
        player.pause();
        player.remove();
      } catch {
        // ignore
      }
    }
  }
  pools.clear();
}
