import { useId, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { Species } from '@/src/types';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { resolveTierAccent } from '@/src/theme/tierAccents';
import { createAppStyles } from '@/src/theme/createAppStyles';

const pedia = mainScreens.slimepedia;
const SILHOUETTE_IMAGE = require('../../../assets/slimes/grass_slime.png');
const BORDER = 2;
const OUTER_RADIUS = 6;
const INNER_RADIUS = OUTER_RADIUS - BORDER;
const CARD_FACE = pedia.ledge;

export type SlimepediaEntryCardProps = {
  cellSize: number;
  placeholder?: boolean;
  species?: Species;
  discovered?: boolean;
  onPress?: () => void;
};

export function SlimepediaEntryCard({
  cellSize,
  placeholder = false,
  species,
  discovered = false,
  onPress,
}: SlimepediaEntryCardProps) {
  if (placeholder || species == null) {
    return (
      <View style={{ width: cellSize }} accessibilityElementsHidden>
        <View style={styles.placeholderShell}>
          <View style={styles.placeholderImage} />
          <View style={styles.placeholderNameGap} />
        </View>
      </View>
    );
  }

  const tierAccent = resolveTierAccent(species.tier);
  const [layout, setLayout] = useState<{ w: number; h: number } | null>(null);
  const rawGradId = useId();
  const safeId = rawGradId.replace(/:/g, '');
  const borderGradId = `pedia-card-border-${safeId}`;

  return (
    <Pressable
      style={{ width: cellSize }}
      onPress={discovered ? onPress : undefined}
      disabled={!discovered}
      accessibilityRole="button"
      accessibilityLabel={
        discovered ? species.name : `Undiscovered slime in ${species.setId} set`
      }
    >
      <View
        style={styles.cardShell}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width < 1 || height < 1) return;
          const w = Math.round(width);
          const h = Math.round(height);
          setLayout((prev) => (prev?.w === w && prev?.h === h ? prev : { w, h }));
        }}
      >
        {layout && (
          <Svg
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            width={layout.w}
            height={layout.h}
            viewBox={`0 0 ${layout.w} ${layout.h}`}
          >
            <Defs>
              <LinearGradient id={borderGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={tierAccent.borderTop} />
                <Stop offset="100%" stopColor={tierAccent.borderBottom} />
              </LinearGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={layout.w}
              height={layout.h}
              rx={OUTER_RADIUS}
              ry={OUTER_RADIUS}
              fill={`url(#${borderGradId})`}
            />
            <Rect
              x={BORDER}
              y={BORDER}
              width={layout.w - BORDER * 2}
              height={layout.h - BORDER * 2}
              rx={INNER_RADIUS}
              ry={INNER_RADIUS}
              fill={CARD_FACE}
            />
          </Svg>
        )}
        <View style={styles.cardContent}>
          <View style={styles.imageWrap}>
            <Image
              source={discovered ? getSlimeImageSource(species.id) : SILHOUETTE_IMAGE}
              style={[styles.image, !discovered && styles.silhouette]}
              resizeMode="contain"
            />
          </View>
          <Text
            style={[styles.name, discovered ? styles.nameDiscovered : styles.nameUndiscovered]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {discovered ? species.name : '???'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = createAppStyles({
  placeholderShell: {
    width: '100%',
    borderRadius: OUTER_RADIUS,
    backgroundColor: pedia.emptySlot,
    paddingTop: 2,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  placeholderImage: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: -8,
    borderRadius: INNER_RADIUS,
    backgroundColor: pedia.emptySlot,
  },
  placeholderNameGap: {
    width: '100%',
    height: 15,
  },
  cardShell: {
    width: '100%',
    position: 'relative',
    borderRadius: OUTER_RADIUS,
    overflow: 'hidden',
    backgroundColor: CARD_FACE,
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
    paddingTop: 2,
    paddingBottom: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  silhouette: {
    tintColor: pedia.undiscovered,
    opacity: 1,
  },
  name: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
  nameDiscovered: {
    color: pedia.slimeName,
  },
  nameUndiscovered: {
    color: pedia.undiscovered,
  },
});
