/**
 * Reveal vs overlay animation toggles — persisted in player_settings.
 */

import { create } from 'zustand';
import { PLAYER_SETTING_KEYS } from '@/src/constants/playerSettings';
import { getPlayerSetting, setBooleanPlayerSetting } from '@/src/db';
import type { FoilMotion } from '@/src/stores/useFoilAnimationStore';

interface AnimationSettingsStore {
  revealAnimationsEnabled: boolean;
  overlayAnimationsEnabled: boolean;
  setRevealAnimationsEnabled: (enabled: boolean) => void;
  setOverlayAnimationsEnabled: (enabled: boolean) => void;
  hydrate: (state: {
    revealAnimationsEnabled: boolean;
    overlayAnimationsEnabled: boolean;
  }) => void;
  reset: () => void;
}

const DEFAULTS = {
  revealAnimationsEnabled: true,
  overlayAnimationsEnabled: true,
};

export const useAnimationSettingsStore = create<AnimationSettingsStore>((set) => ({
  ...DEFAULTS,
  setRevealAnimationsEnabled: (enabled) => {
    set({ revealAnimationsEnabled: enabled });
    void setBooleanPlayerSetting(PLAYER_SETTING_KEYS.REVEAL_ANIMATIONS_ENABLED, enabled).catch(
      (err) => console.warn('Reveal animation setting persist failed:', err)
    );
  },
  setOverlayAnimationsEnabled: (enabled) => {
    set({ overlayAnimationsEnabled: enabled });
    void setBooleanPlayerSetting(PLAYER_SETTING_KEYS.OVERLAY_ANIMATIONS_ENABLED, enabled).catch(
      (err) => console.warn('Overlay animation setting persist failed:', err)
    );
  },
  hydrate: (state) => set(state),
  reset: () => set(DEFAULTS),
}));

export async function hydrateAnimationSettingsFromDb(): Promise<void> {
  const [revealRaw, overlayRaw, legacyRaw] = await Promise.all([
    getPlayerSetting(PLAYER_SETTING_KEYS.REVEAL_ANIMATIONS_ENABLED),
    getPlayerSetting(PLAYER_SETTING_KEYS.OVERLAY_ANIMATIONS_ENABLED),
    getPlayerSetting(PLAYER_SETTING_KEYS.ANIMATIONS_ENABLED),
  ]);

  const legacyEnabled = legacyRaw === null ? true : legacyRaw === '1';

  const revealAnimationsEnabled =
    revealRaw === null ? legacyEnabled : revealRaw === '1';
  const overlayAnimationsEnabled =
    overlayRaw === null ? legacyEnabled : overlayRaw === '1';

  useAnimationSettingsStore.getState().hydrate({
    revealAnimationsEnabled,
    overlayAnimationsEnabled,
  });
}

/** Sleep / fusion / collection reveal sequences and candy collect. */
export function areRevealAnimationsEnabled(): boolean {
  return useAnimationSettingsStore.getState().revealAnimationsEnabled;
}

/** Foil motion and modal transitions. */
export function areOverlayAnimationsEnabled(): boolean {
  return useAnimationSettingsStore.getState().overlayAnimationsEnabled;
}

export function resolveSlimeFoilMotion(motion: FoilMotion = 'full'): FoilMotion {
  if (!areOverlayAnimationsEnabled()) {
    return motion === 'off' ? 'off' : 'static';
  }
  return motion;
}
