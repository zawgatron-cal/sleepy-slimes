/** Screen-oriented UI building blocks (modals, etc.). */

export { OutlinedSvgLabel, type OutlinedSvgLabelProps } from './OutlinedSvgLabel';
export { FitText, type FitTextProps } from './FitText';
export {
  fitTextSize,
  fitTextSvgMetrics,
  fitTextSvgMetricsForText,
  FIT_TEXT_PRESETS,
  type FitTextPresetKey,
  type FitTextSizeConfig,
} from '@/src/utils/fitTextSize';
export { CandyGlyph } from './CandyGlyph';
export {
  CandyPill,
  TabHeaderCandyPill,
  CANDY_PILL_GLYPH_SIZE,
  type CandyPillProps,
} from './CandyPill';
export { SlimeArtwork, isExoticSlimeVariant, isGoldSlimeVariant, isPrismaticSlimeVariant, type SlimeArtworkProps } from './SlimeArtwork';
export { PrismaticFoilOverlay } from './PrismaticFoilOverlay';
export { CandyCounterPill } from './CandyCounterPill';
export {
  CollectionModalCandyPill,
  CollectionDetailCandyPill,
  CollectionDetailConvertPill,
  COLLECTION_DETAIL_TOP_PILL_OFFSET,
  type CollectionModalCandyPillProps,
  type CollectionDetailCandyPillProps,
  type CollectionDetailConvertPillProps,
} from './collection/CollectionDetailCandyPill';
export { StreakCounterPill } from './StreakCounterPill';
export { SleepModal, type SleepModalProps } from './sleep/SleepModal';
export { MoreMenuModal, type MoreMenuModalProps } from './sleep/MoreMenuModal';
export {
  SleepingTrackingPhase,
  type SleepingTrackingPhaseProps,
} from './sleep/SleepingTrackingPhase';
export { SleepSummaryPhase, type SleepSummaryPhaseProps } from './sleep/SleepSummaryPhase';
export { SleepRevealPhase, type SleepRevealPhaseProps } from './sleep/SleepRevealPhase';
export {
  SleepCandyCollectOverlay,
  type SleepCandyCollectOverlayProps,
} from './sleep/SleepCandyCollectOverlay';
export {
  SleepDataPillLabel,
  SleepCtaLabel,
  SleepIdleTopRow,
  SleepIdleZoneArea,
  SleepZonePreview,
  SleepZoneSelectPanel,
} from './sleep/SleepIdleVisuals';
export { ZoneUnlockModal, type ZoneUnlockModalProps } from './sleep/ZoneUnlockModal';
export {
  FusionSlimePickerModal,
  type FusionSlimePickerModalProps,
} from './fusion/FusionSlimePickerModal';
export type { FusionPickerRow } from '@/src/utils/fusionPickerRows';
export { FusionRevealOverlay, type FusionRevealOverlayProps } from './fusion/FusionRevealOverlay';
export { FusionSlot, type FusionSlotProps } from './fusion/FusionSlot';
export { FusionFuseCtaLabel, type FusionFuseCtaLabelProps } from './fusion/FusionFuseCtaLabel';
export { TutorialNpcDialogue, type TutorialDialogueMessage, type TutorialNpcDialogueProps } from './tutorial/TutorialNpcDialogue';
export { TutorialTapPrompt, type TutorialTapPromptProps, type TutorialTapTargetRect } from './tutorial/TutorialTapPrompt';
export {
  CollectionSlimeCard,
  COLLECTION_SLIME_REVEAL_STAGGER_MS,
  COLLECTION_SLIME_REVEAL_START_DELAY_MS,
  COLLECTION_SLIME_REVEAL_SETTLE_MS,
  type CollectionSlimeCardProps,
} from './collection/CollectionSlimeCard';
export {
  CollectionSlimeDetailModal,
  type CollectionSlimeDetailModalProps,
  type CollectionSlimeDetail,
} from './collection/CollectionSlimeDetailModal';
export {
  SlimeConvertConfirmModal,
  type SlimeConvertConfirmModalProps,
} from './collection/SlimeConvertConfirmModal';
export {
  SlimepediaEntryCard,
  type SlimepediaEntryCardProps,
} from './slimepedia/SlimepediaEntryCard';
export {
  SlimepediaSpeciesDetail,
  type SlimepediaSpeciesDetailProps,
} from './slimepedia/SlimepediaSpeciesDetail';
