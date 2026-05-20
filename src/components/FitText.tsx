/**
 * RN Text that picks font size from string length via `fitTextSize` presets.
 */

import { useMemo } from 'react';
import { Text, type TextProps } from 'react-native';
import {
  fitTextSize,
  resolveFitTextConfig,
  type FitTextPresetKey,
  type FitTextSizeConfig,
} from '@/src/utils/fitTextSize';

export type FitTextProps = TextProps & {
  text: string;
  preset?: FitTextPresetKey;
  fit?: FitTextSizeConfig;
  /** Extra line height above fontSize (default 2). */
  lineHeightExtra?: number;
};

export function FitText({
  text,
  preset,
  fit,
  style,
  lineHeightExtra = 2,
  ...rest
}: FitTextProps) {
  const config = preset ? resolveFitTextConfig(preset) : fit;
  const fontSize = useMemo(() => {
    if (!config) return 14;
    return fitTextSize(text, config);
  }, [text, config]);

  return (
    <Text
      style={[style, { fontSize, lineHeight: fontSize + lineHeightExtra }]}
      {...rest}
    >
      {text}
    </Text>
  );
}
