/**
 * Music and SFX toggles + volume — persisted in player_settings.
 */

import { create } from 'zustand';
import {
  DEFAULT_SOUND_VOLUME,
  PLAYER_SETTING_KEYS,
} from '@/src/constants/playerSettings';
import {
  getBooleanPlayerSetting,
  getNumberPlayerSetting,
  setBooleanPlayerSetting,
  setNumberPlayerSetting,
} from '@/src/db';

interface SoundSettingsStore {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  setMusicEnabled: (enabled: boolean) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  hydrate: (state: {
    musicEnabled: boolean;
    sfxEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
  }) => void;
  reset: () => void;
}

const DEFAULTS = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: DEFAULT_SOUND_VOLUME,
  sfxVolume: DEFAULT_SOUND_VOLUME,
};

export const useSoundSettingsStore = create<SoundSettingsStore>((set) => ({
  ...DEFAULTS,
  setMusicEnabled: (enabled) => {
    set({ musicEnabled: enabled });
    void setBooleanPlayerSetting(PLAYER_SETTING_KEYS.MUSIC_ENABLED, enabled).catch((err) =>
      console.warn('Music setting persist failed:', err)
    );
  },
  setSfxEnabled: (enabled) => {
    set({ sfxEnabled: enabled });
    void setBooleanPlayerSetting(PLAYER_SETTING_KEYS.SFX_ENABLED, enabled).catch((err) =>
      console.warn('SFX setting persist failed:', err)
    );
  },
  setMusicVolume: (volume) => {
    set({ musicVolume: volume });
    void setNumberPlayerSetting(PLAYER_SETTING_KEYS.MUSIC_VOLUME, volume).catch((err) =>
      console.warn('Music volume persist failed:', err)
    );
  },
  setSfxVolume: (volume) => {
    set({ sfxVolume: volume });
    void setNumberPlayerSetting(PLAYER_SETTING_KEYS.SFX_VOLUME, volume).catch((err) =>
      console.warn('SFX volume persist failed:', err)
    );
  },
  hydrate: (state) => set(state),
  reset: () => set(DEFAULTS),
}));

export async function hydrateSoundSettingsFromDb(): Promise<void> {
  const [musicEnabled, sfxEnabled, musicVolume, sfxVolume] = await Promise.all([
    getBooleanPlayerSetting(PLAYER_SETTING_KEYS.MUSIC_ENABLED, true),
    getBooleanPlayerSetting(PLAYER_SETTING_KEYS.SFX_ENABLED, true),
    getNumberPlayerSetting(PLAYER_SETTING_KEYS.MUSIC_VOLUME, DEFAULT_SOUND_VOLUME),
    getNumberPlayerSetting(PLAYER_SETTING_KEYS.SFX_VOLUME, DEFAULT_SOUND_VOLUME),
  ]);
  useSoundSettingsStore.getState().hydrate({
    musicEnabled,
    sfxEnabled,
    musicVolume,
    sfxVolume,
  });
}

/** For future audio playback — read without subscribing. */
export function isMusicEnabled(): boolean {
  return useSoundSettingsStore.getState().musicEnabled;
}

export function isSfxEnabled(): boolean {
  return useSoundSettingsStore.getState().sfxEnabled;
}

export function getMusicVolume(): number {
  const { musicEnabled, musicVolume } = useSoundSettingsStore.getState();
  return musicEnabled ? musicVolume : 0;
}

export function getSfxVolume(): number {
  const { sfxEnabled, sfxVolume } = useSoundSettingsStore.getState();
  return sfxEnabled ? sfxVolume : 0;
}
