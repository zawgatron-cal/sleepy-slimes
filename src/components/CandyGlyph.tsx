/**
 * Striped candy icon (shared by header + collection detail pills).
 */

import { useId, useMemo } from 'react';
import Svg, { Ellipse, G, Rect, Defs, ClipPath } from 'react-native-svg';

const GLYPH_VIEW = 52;
const STRIPE_PINK = '#FF5C8D';
const STRIPE_YELLOW = '#F9E04A';
const BOW = '#FF6B9D';
const OUTLINE = '#4A3540';
const BODY_FILL = '#FFF5F7';

export type CandyGlyphProps = {
  size?: number;
};

export function CandyGlyph({ size = GLYPH_VIEW }: CandyGlyphProps) {
  const rawId = useId();
  const clipId = useMemo(
    () => `candy-clip-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`,
    [rawId]
  );
  const cx = 26;
  const cy = 26;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${GLYPH_VIEW} ${GLYPH_VIEW}`} accessibilityElementsHidden>
      <Ellipse cx={28} cy={29} rx={16} ry={12} fill="rgba(0,0,0,0.08)" />
      <G transform={`rotate(-38 ${cx} ${cy})`}>
        <Defs>
          <ClipPath id={clipId}>
            <Ellipse cx={cx} cy={cy} rx={11} ry={9.2} />
          </ClipPath>
        </Defs>
        <Ellipse
          cx={14}
          cy={cy}
          rx={5.2}
          ry={4.6}
          fill={BOW}
          stroke={OUTLINE}
          strokeWidth={1.6}
        />
        <Ellipse
          cx={38}
          cy={cy}
          rx={5.2}
          ry={4.6}
          fill={BOW}
          stroke={OUTLINE}
          strokeWidth={1.6}
        />
        <Ellipse cx={cx} cy={cy} rx={11} ry={9.2} fill={BODY_FILL} />
        <G clipPath={`url(#${clipId})`}>
          {[-10, -6, -2, 2, 6, 10, 14].map((dx, i) => (
            <Rect
              key={i}
              x={cx + dx - 1.75}
              y={15}
              width={3.5}
              height={22}
              fill={i % 2 === 0 ? STRIPE_PINK : STRIPE_YELLOW}
              rx={0.8}
            />
          ))}
        </G>
        <Ellipse
          cx={cx}
          cy={cy}
          rx={11}
          ry={9.2}
          fill="none"
          stroke={OUTLINE}
          strokeWidth={2}
        />
      </G>
    </Svg>
  );
}
