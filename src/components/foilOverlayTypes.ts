import type { ViewStyle } from 'react-native';
import type { FoilMotion } from '@/src/stores/useFoilAnimationStore';

export type FoilOverlayProps = {
  style?: ViewStyle;
  motion?: FoilMotion;
};
