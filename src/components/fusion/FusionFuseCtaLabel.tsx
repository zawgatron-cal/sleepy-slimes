import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const FUSE_CTA_LABEL = 'Fuse';
const FUSE_CTA_FONT = 36;
const FUSE_CTA_HEIGHT = 48;
const FUSE_CTA_STROKE = 1.7;

export type FusionFuseCtaLabelProps = {
  muted?: boolean;
};

export function FusionFuseCtaLabel({ muted = false }: FusionFuseCtaLabelProps) {
  const [w, setW] = useState(168);
  const cx = w / 2;
  const baselineY = 36;
  const strokeColor = muted
    ? mainScreens.fuse.disabledButtonTextBorder
    : mainScreens.fuse.specialTextBorder;
  const fillColor = muted
    ? mainScreens.fuse.disabledButtonText
    : mainScreens.shared.onPrimary;

  return (
    <View
      style={styles.fuseCtaSvgWrap}
      onLayout={(e) => {
        const nextW = Math.floor(e.nativeEvent.layout.width);
        if (nextW > 0 && nextW !== w) setW(nextW);
      }}
    >
      <Svg width={w} height={FUSE_CTA_HEIGHT}>
        <SvgText
          x={cx}
          y={baselineY}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={FUSE_CTA_FONT}
          fontWeight="900"
          stroke={strokeColor}
          strokeWidth={FUSE_CTA_STROKE}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {FUSE_CTA_LABEL}
        </SvgText>
        <SvgText
          x={cx}
          y={baselineY}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={FUSE_CTA_FONT}
          fontWeight="900"
          fill={fillColor}
        >
          {FUSE_CTA_LABEL}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = createAppStyles({
  fuseCtaSvgWrap: {
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
