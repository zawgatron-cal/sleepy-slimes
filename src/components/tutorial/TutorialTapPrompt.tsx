/**
 * Minimal finger-tap hint for contextual tutorial targets.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const t = mainScreens.idle;

export type TutorialTapTargetRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TutorialTapPromptProps = {
  visible: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
  /** Center hand on rect; place label under the rect bottom. */
  targetRect?: TutorialTapTargetRect;
  /** Label relative to the hand — use `above` for bottom tab bar targets. */
  labelPosition?: 'above' | 'below';
};

export function TutorialTapPrompt({
  visible,
  label,
  style,
  targetRect,
  labelPosition = 'below',
}: TutorialTapPromptProps) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    bounce.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 680,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 680,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, bounce]);

  if (!visible) return null;

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const hand = (
    <Animated.View style={[styles.iconRow, { transform: [{ translateY }] }]}>
      <Ionicons name="hand-right" size={34} color={t.primaryText} />
    </Animated.View>
  );

  if (targetRect) {
    const labelAboveHand = labelPosition === 'above';
    const labelTop = labelAboveHand
      ? Math.max(8, targetRect.y - 52)
      : targetRect.y + targetRect.height + 8;

    return (
      <>
        {label && labelAboveHand ? (
          <View
            style={[
              styles.labelBelowTarget,
              {
                left: targetRect.x,
                top: labelTop,
                width: targetRect.width,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={[styles.label, styles.labelUnderCard]}>{label}</Text>
          </View>
        ) : null}
        <View
          style={[
            styles.targetOverlay,
            {
              left: targetRect.x,
              top: targetRect.y,
              width: targetRect.width,
              height: targetRect.height,
            },
            style,
          ]}
          pointerEvents="none"
        >
          {hand}
        </View>
        {label && !labelAboveHand ? (
          <View
            style={[
              styles.labelBelowTarget,
              {
                left: targetRect.x,
                top: labelTop,
                width: targetRect.width,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={[styles.label, styles.labelUnderCard]}>{label}</Text>
          </View>
        ) : null}
      </>
    );
  }

  if (labelPosition === 'above' && label) {
    return (
      <View style={[styles.wrap, style]} pointerEvents="none">
        <Text style={[styles.label, styles.labelAboveHand]}>{label}</Text>
        {hand}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      {hand}
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = createAppStyles({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 20,
  },
  targetOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 45,
  },
  labelBelowTarget: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 45,
  },
  iconRow: {
    backgroundColor: 'rgba(255, 248, 248, 0.92)',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: t.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '800',
    color: t.primaryText,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 248, 248, 0.92)',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: t.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  labelUnderCard: {
    marginTop: 0,
  },
  labelAboveHand: {
    marginTop: 0,
    marginBottom: 6,
  },
});
