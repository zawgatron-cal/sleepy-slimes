/**
 * Pointy-top hex honeycomb background — shared layout for sleep + slimepedia screens.
 */

import { useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { buildPointyTopHexTileLayout } from '@/src/utils/hexTileLayout';

/** Default horizontal pitch scale (summary, detail, tracking). */
export const HEX_TILE_HORIZONTAL_PITCH_SCALE = 1.14;

export type HexTileBackgroundProps = {
  width: number;
  height: number;
  tileSource: ImageSourcePropType;
  /** Tile size = width / tilesAcross (fewer = larger motifs). */
  tilesAcross?: number;
  horizontalPitchScale?: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

export function HexTileBackground({
  width,
  height,
  tileSource,
  tilesAcross = 3,
  horizontalPitchScale = HEX_TILE_HORIZONTAL_PITCH_SCALE,
  opacity = 1,
  style,
}: HexTileBackgroundProps) {
  const displayTilePx = width / tilesAcross;
  const hexPlacements = useMemo(
    () =>
      buildPointyTopHexTileLayout(width, height, displayTilePx, {
        horizontalPitchScale,
      }),
    [width, height, displayTilePx, horizontalPitchScale],
  );

  return (
    <View
      style={[styles.layer, { width, height, opacity }, style]}
      pointerEvents="none"
    >
      {hexPlacements.map(({ key, left, top }) => (
        <Image
          key={key}
          source={tileSource}
          style={[
            styles.tile,
            { left, top, width: displayTilePx, height: displayTilePx },
          ]}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tile: {
    position: 'absolute',
  },
});
