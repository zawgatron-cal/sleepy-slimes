/**
 * Minimal finger-tap hint for contextual tutorial targets.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const t = mainScreens.idle;

const DEFAULT_HAND_SIZE = 34;

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
  handSize?: number;
  /** Sit the hand under the target — better for small header buttons. */
  handPlacement?: 'center' | 'below';
  /** Widen label past narrow targets; stays centered on the target. */
  labelMinWidth?: number;
};

function getHandMetrics(handSize: number) {
  const compact = handSize <= 26;
  return {
    iconSize: handSize,
    padH: compact ? 7 : 12,
    padV: compact ? 5 : 8,
    borderWidth: compact ? 2 : 3,
    labelFontSize: compact ? 14 : 16,
    labelPadH: compact ? 10 : 12,
    labelPadV: compact ? 5 : 6,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function TutorialTapPrompt({
  visible,
  label,
  style,
  targetRect,
  labelPosition = 'below',
  handSize = DEFAULT_HAND_SIZE,
  handPlacement = 'center',
  labelMinWidth = 0,
}: TutorialTapPromptProps) {
  const { width: windowWidth } = useWindowDimensions();
  const bounce = useRef(new Animated.Value(0)).current;
  const metrics = getHandMetrics(handSize);
  const bubbleWidth = metrics.iconSize + metrics.padH * 2 + metrics.borderWidth * 2;
  const bubbleHeight = metrics.iconSize + metrics.padV * 2 + metrics.borderWidth * 2;

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
    outputRange: [0, handPlacement === 'below' ? -6 : -8],
  });

  const handBubbleStyle = {
    backgroundColor: 'rgba(255, 248, 248, 0.92)',
    borderRadius: 999,
    borderWidth: metrics.borderWidth,
    borderColor: t.border,
    paddingHorizontal: metrics.padH,
    paddingVertical: metrics.padV,
  };

  const hand = (
    <Animated.View style={[styles.iconRow, handBubbleStyle, { transform: [{ translateY }] }]}>
      <Ionicons name="hand-right" size={metrics.iconSize} color={t.primaryText} />
    </Animated.View>
  );

  const labelStyle = [
    styles.label,
    {
      fontSize: metrics.labelFontSize,
      borderWidth: metrics.borderWidth,
      paddingHorizontal: metrics.labelPadH,
      paddingVertical: metrics.labelPadV,
    },
  ];

  if (targetRect) {
    const labelAboveHand = labelPosition === 'above';
    const labelWidth = Math.max(targetRect.width, labelMinWidth);
    const labelLeft = targetRect.x + targetRect.width / 2 - labelWidth / 2;

    if (handPlacement === 'below') {
      const handLeft = clamp(
        targetRect.x + targetRect.width / 2 - bubbleWidth / 2,
        8,
        windowWidth - bubbleWidth - 8
      );
      const handTop = targetRect.y + targetRect.height + 6;
      const labelTop = handTop + bubbleHeight + 8;

      return (
        <>
          <View
            style={[
              styles.handAnchor,
              { left: handLeft, top: handTop, width: bubbleWidth, height: bubbleHeight },
              style,
            ]}
            pointerEvents="none"
          >
            {hand}
          </View>
          {label ? (
            <View
              style={[
                styles.labelBelowTarget,
                { left: labelLeft, top: labelTop, width: labelWidth },
              ]}
              pointerEvents="none"
            >
              <Text style={[labelStyle, styles.labelUnderCard]}>{label}</Text>
            </View>
          ) : null}
        </>
      );
    }

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
                left: labelLeft,
                top: labelTop,
                width: labelWidth,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={[labelStyle, styles.labelUnderCard]}>{label}</Text>
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
                left: labelLeft,
                top: labelTop,
                width: labelWidth,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={[labelStyle, styles.labelUnderCard]}>{label}</Text>
          </View>
        ) : null}
      </>
    );
  }

  if (labelPosition === 'above' && label) {
    return (
      <View style={[styles.wrap, style]} pointerEvents="none">
        <Text style={[labelStyle, styles.labelAboveHand]}>{label}</Text>
        {hand}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      {hand}
      {label ? <Text style={labelStyle}>{label}</Text> : null}
    </View>
  );
}

const styles = createAppStyles({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 20,
  },
  handAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 45,
  },
  targetOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 45,
    overflow: 'visible',
  },
  labelBelowTarget: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 45,
  },
  iconRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 6,
    fontWeight: '800',
    color: t.primaryText,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 248, 248, 0.92)',
    borderRadius: 12,
    borderColor: t.border,
    overflow: 'visible',
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
