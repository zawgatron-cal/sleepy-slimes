/**
 * Critical SFX — drop matching filenames into assets/audio/sfx/.
 *
 * | File            | Used for |
 * |-----------------|----------|
 * | ui-tap.mp3      | Tabs, buttons, dialogue advance, fusion slot pick |
 * | ui-success.mp3  | Sleep start, candy done, zone unlock, equip, level up |
 * | ui-error.mp3    | Failed actions / validation alerts |
 * | reveal.mp3      | Sleep + fusion slime pop-in |
 * | candy-clink.mp3 | Each candy particle landing on the pill |
 * | collection-pop.mp3 | Each slime popping into the collection grid |
 * | variant-twinkle.mp3 | Variant silhouette star tease sparkle |
 */

export const SOUND_EFFECTS = {
  ui_tap: require('../../assets/audio/sfx/ui-tap.mp3'),
  ui_success: require('../../assets/audio/sfx/ui-success.mp3'),
  ui_error: require('../../assets/audio/sfx/ui-error.mp3'),
  reveal: require('../../assets/audio/sfx/reveal.mp3'),
  candy_clink: require('../../assets/audio/sfx/candy-clink.mp3'),
  collection_pop: require('../../assets/audio/sfx/collection-pop.mp3'),
  variant_twinkle: require('../../assets/audio/sfx/variant-twinkle.mp3'),
} as const;

export type SoundEffectId = keyof typeof SOUND_EFFECTS;

/** Per-effect mix trim (multiplied with Settings → SFX volume). */
export const SOUND_EFFECT_GAIN: Record<SoundEffectId, number> = {
  ui_tap: 0.65,
  ui_success: 0.4,
  ui_error: 0.9,
  reveal: 0.3,
  candy_clink: 0.55,
  collection_pop: 0.55,
  variant_twinkle: 0.65,
};

/** Skip leading silence so the audible hit lines up with play(). */
export const SOUND_EFFECT_START_SEC: Partial<Record<SoundEffectId, number>> = {
  candy_clink: 0,
  collection_pop: 0,
};
