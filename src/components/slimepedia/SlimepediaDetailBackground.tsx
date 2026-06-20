/**
 * Persistent slimepedia detail hex background — mount once per slimepedia session.
 */

import { memo } from 'react';
import { HexTileBackground } from '@/src/components/HexTileBackground';
import { SLIMEPEDIA_DETAIL_TILE } from '@/src/constants/slimepediaAssets';

const DETAIL_HEX_TILES_ACROSS = 3;

export type SlimepediaDetailBackgroundProps = {
  width: number;
  height: number;
  visible?: boolean;
};

export const SlimepediaDetailBackground = memo(function SlimepediaDetailBackground({
  width,
  height,
  visible = true,
}: SlimepediaDetailBackgroundProps) {
  return (
    <HexTileBackground
      width={width}
      height={height}
      tileSource={SLIMEPEDIA_DETAIL_TILE}
      tilesAcross={DETAIL_HEX_TILES_ACROSS}
      style={visible ? undefined : { opacity: 0 }}
    />
  );
});
