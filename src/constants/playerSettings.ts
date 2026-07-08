/** Keys for `player_settings` table. */

export const PLAYER_SETTING_KEYS = {
  EQUIPPED_SLIME_ID: 'equipped_slime_id',
  MUSIC_ENABLED: 'music_enabled',
  SFX_ENABLED: 'sfx_enabled',
  MUSIC_VOLUME: 'music_volume',
  SFX_VOLUME: 'sfx_volume',
  /** JSON payload while a sleep session is in progress (crash recovery). */
  ACTIVE_SLEEP_SESSION: 'active_sleep_session',
  /** JSON array of completed tutorial step ids. */
  TUTORIAL_COMPLETED_STEPS: 'tutorial_completed_steps',
} as const;

/** Default volume when unset (0–1). */
export const DEFAULT_SOUND_VOLUME = 0.8;
