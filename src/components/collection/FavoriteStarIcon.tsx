import { StyleSheet, Text, View } from 'react-native';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const t = mainScreens.collection.detailModal;

/** Inner ★ size vs outer — lower = thicker border ring. */
const FILL_SCALE = 0.52;

export type FavoriteStarIconProps = {
  size?: number;
  active?: boolean;
};

/** Two-layer filled star: thick border glyph + inner fill (fav / unfav palettes). */
export function FavoriteStarIcon({ size = 24, active = true }: FavoriteStarIconProps) {
  const borderSize = size;
  const fillSize = Math.max(10, Math.round(size * FILL_SCALE));
  const borderColor = active ? t.favoriteStarFavBorder : t.favoriteStarUnfavBorder;
  const fillColor = active ? t.favoriteStarFavFill : t.favoriteStarUnfavFill;

  return (
    <View style={[styles.wrap, { width: size, height: size }]} importantForAccessibility="no-hide-descendants">
      <View style={styles.layer} pointerEvents="none">
        <Text
          style={[
            styles.glyph,
            { fontSize: borderSize, lineHeight: borderSize, color: borderColor },
          ]}
          accessible={false}
        >
          ★
        </Text>
      </View>
      <View style={styles.layer} pointerEvents="none">
        <Text
          style={[
            styles.glyph,
            { fontSize: fillSize, lineHeight: fillSize, color: fillColor },
          ]}
          accessible={false}
        >
          ★
        </Text>
      </View>
    </View>
  );
}

const styles = createAppStyles({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
