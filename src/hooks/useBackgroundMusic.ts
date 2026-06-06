import { useEffect } from 'react';
import {
  preloadBackgroundMusic,
  setBackgroundMusicVolume,
  syncBackgroundMusic,
} from '@/src/services/backgroundMusic';
import { useSoundSettingsStore } from '@/src/stores/useSoundSettingsStore';

/**
 * Keeps looping BGM in sync with settings and whether the main tabs UI is active.
 * Volume changes are applied separately so slider drags don't restart playback.
 */
export function useBackgroundMusic(shouldPlay: boolean) {
  const musicEnabled = useSoundSettingsStore((s) => s.musicEnabled);
  const musicVolume = useSoundSettingsStore((s) => s.musicVolume);
  const hasAudibleVolume = musicVolume > 0;

  useEffect(() => {
    void preloadBackgroundMusic();
  }, []);

  useEffect(() => {
    void syncBackgroundMusic(shouldPlay && musicEnabled && hasAudibleVolume);
  }, [shouldPlay, musicEnabled, hasAudibleVolume]);

  useEffect(() => {
    if (!musicEnabled) return;
    void setBackgroundMusicVolume();
  }, [musicVolume, musicEnabled]);
}
