import { Animated, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { candyCollectScrimOpacity, SCRIM_COLOR } from './candyCollectScrimOpacity';

type CandyCollectScrimProps = {
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none';
};

export function CandyCollectScrim({
  style,
  pointerEvents = 'auto',
}: CandyCollectScrimProps) {
  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: SCRIM_COLOR, opacity: candyCollectScrimOpacity },
        style,
      ]}
    />
  );
}
