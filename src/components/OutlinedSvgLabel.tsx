/**
 * Outlined display text (stroke + fill) via react-native-svg.
 * Shared by screen titles, CTAs, and pills across the app.
 */

import { useMemo, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';
import { createAppStyles } from '@/src/theme/createAppStyles';
import {
  fitTextSvgMetricsForText,
  type FitTextPresetKey,
  type FitTextSizeConfig,
} from '@/src/utils/fitTextSize';

export type OutlinedSvgLabelTextAnchor = 'start' | 'middle' | 'end';

type OutlinedSvgLabelBaseProps = {
  text: string;
  strokeColor: string;
  fillColor: string;
  strokeWidth?: number;
  textAnchor?: OutlinedSvgLabelTextAnchor;
  x?: number;
  style?: StyleProp<ViewStyle>;
  defaultWidth?: number;
  minWidth?: number;
};

export type OutlinedSvgLabelProps = OutlinedSvgLabelBaseProps &
  (
    | {
        /** Fixed size — titles/CTAs with constant copy. */
        fontSize: number;
        height?: number;
        baselineY?: number;
        fit?: never;
      }
    | {
        /** Auto size from length (+ width when layout is measured). */
        fit: FitTextPresetKey | FitTextSizeConfig;
        fontSize?: never;
        height?: never;
        baselineY?: never;
      }
  );

function resolveAnchorX(
  width: number,
  textAnchor: OutlinedSvgLabelTextAnchor,
  x?: number,
): number {
  if (x != null) return x;
  if (textAnchor === 'middle') return width / 2;
  if (textAnchor === 'end') return width;
  return 0;
}

export function OutlinedSvgLabel(props: OutlinedSvgLabelProps) {
  const {
    text,
    strokeColor,
    fillColor,
    strokeWidth = 2,
    textAnchor = 'middle',
    x,
    style,
    defaultWidth = 180,
    minWidth,
  } = props;

  const [width, setWidth] = useState(defaultWidth);

  const { fontSize, height, baselineY } = useMemo(() => {
    if ('fit' in props && props.fit) {
      return fitTextSvgMetricsForText(text, props.fit, width);
    }
    const size = props.fontSize;
    const h = props.height ?? Math.round(size * 1.15);
    const y = props.baselineY ?? Math.round(h * 0.78);
    return { fontSize: size, height: h, baselineY: y };
  }, [props, text, width]);

  const anchorX = resolveAnchorX(width, textAnchor, x);

  return (
    <View
      style={[styles.wrap, minWidth != null ? { minWidth } : null, style]}
      onLayout={(e) => {
        const nextW = Math.floor(e.nativeEvent.layout.width);
        if (nextW > 0 && nextW !== width) setWidth(nextW);
      }}
    >
      <Svg width={width} height={height}>
        <SvgText
          x={anchorX}
          y={baselineY}
          textAnchor={textAnchor}
          fontFamily={APP_FONT_FAMILY}
          fontSize={fontSize}
          fontWeight="900"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {text}
        </SvgText>
        <SvgText
          x={anchorX}
          y={baselineY}
          textAnchor={textAnchor}
          fontFamily={APP_FONT_FAMILY}
          fontSize={fontSize}
          fontWeight="900"
          fill={fillColor}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = createAppStyles({
  wrap: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
