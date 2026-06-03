import { useEffect } from 'react';
import {
  preloadBackgroundMusic,
  syncBackgroundMusic,
  unloadBackgroundMusic,
} from '@/src/services/backgroundMusic';
import { useSoundSettingsStore } from '@/src/stores/useSoundSettingsStore';

/**
 * Keeps looping BGM in sync with settings and whether the main tabs UI is active.
 */
export function useBackgroundMusic(shouldPlay: boolean) {
  const musicEnabled = useSoundSettingsStore((s) => s.musicEnabled);
  const musicVolume = useSoundSettingsStore((s) => s.musicVolume);

  useEffect(() => {
    void preloadBackgroundMusic();
  }, []);

  useEffect(() => {
    const playing = shouldPlay && musicEnabled && musicVolume > 0;
    void syncBackgroundMusic(playing);
  }, [shouldPlay, musicEnabled, musicVolume]);

  useEffect(() => {
    return () => {
      void unloadBackgroundMusic();
    };
  }, []);
}
