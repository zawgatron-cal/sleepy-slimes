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
export { CandyBalancePill, CandyCounterPill } from './CandyCounterPill';
export { CollectionDetailCandyPill } from './collection/CollectionDetailCandyPill';
export { StreakCounterPill } from './StreakCounterPill';
export { SleepModal, type SleepModalProps } from './sleep/SleepModal';
export {
  SleepingTrackingPhase,
  type SleepingTrackingPhaseProps,
} from './sleep/SleepingTrackingPhase';
export { SleepSummaryPhase, type SleepSummaryPhaseProps } from './sleep/SleepSummaryPhase';
export { SleepRevealPhase, type SleepRevealPhaseProps } from './sleep/SleepRevealPhase';
export {
  SleepDataPillLabel,
  SleepCtaLabel,
  SleepIdleTopRow,
  SleepZonePreview,
  SleepZoneSelectPanel,
} from './sleep/SleepIdleVisuals';
export {
  FusionSlimePickerModal,
  type FusionSlimePickerModalProps,
} from './fusion/FusionSlimePickerModal';
export type { FusionPickerRow } from '@/src/utils/fusionPickerRows';
export { FusionResultModal, type FusionResultModalProps } from './fusion/FusionResultModal';
export { FusionSlot, type FusionSlotProps } from './fusion/FusionSlot';
export { FusionFuseCtaLabel, type FusionFuseCtaLabelProps } from './fusion/FusionFuseCtaLabel';
export {
  CollectionSlimeCard,
  type CollectionSlimeCardProps,
} from './collection/CollectionSlimeCard';
export {
  CollectionSlimeDetailModal,
  type CollectionSlimeDetailModalProps,
  type CollectionSlimeDetail,
} from './collection/CollectionSlimeDetailModal';
export {
  SlimepediaEntryCard,
  type SlimepediaEntryCardProps,
} from './slimepedia/SlimepediaEntryCard';
export {
  SlimepediaSpeciesDetail,
  type SlimepediaSpeciesDetailProps,
} from './slimepedia/SlimepediaSpeciesDetail';
