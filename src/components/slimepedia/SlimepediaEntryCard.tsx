import { useId, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { FitText } from '@/src/components/FitText';
import type { Species } from '@/src/types';
import {
  useSlimeImageCacheKey,
  useSlimeImageSource,
  getSlimeSilhouetteImageStyle,
} from '@/src/utils/slimeAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { resolveTierAccent } from '@/src/theme/tierAccents';
import { createAppStyles } from '@/src/theme/createAppStyles';

import { UNDISCOVERED_COPY } from '@/src/utils/slimepediaContent';

const pedia = mainScreens.slimepedia;
const BORDER = 2;
const OUTER_RADIUS = 6;
const INNER_RADIUS = OUTER_RADIUS - BORDER;
const CARD_FACE = pedia.surface;
const CARD_H_PAD = 4;
const NAME_ROW_HEIGHT = 15;

function cellRootStyle(cellSize: number): ViewStyle {
  return {
    width: cellSize,
    maxWidth: cellSize,
    minWidth: cellSize,
    flexGrow: 0,
    flexShrink: 0,
  };
}

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
  const imageSource = useSlimeImageSource(species?.id);
  const imageKey = useSlimeImageCacheKey(species?.id);
  const imageSize = Math.max(1, cellSize - CARD_H_PAD * 2);
  const nameMaxWidth = imageSize;
  const tierAccent = resolveTierAccent(species?.tier);
  const [layout, setLayout] = useState<{ w: number; h: number } | null>(null);
  const rawGradId = useId();
  const safeId = rawGradId.replace(/:/g, '');
  const borderGradId = `pedia-card-border-${safeId}`;
  const displayName =
    species != null && discovered ? species.name : UNDISCOVERED_COPY;
  const imageWrapStyle = useMemo(
    () => [styles.imageWrap, { width: imageSize, height: imageSize }],
    [imageSize]
  );

  if (placeholder || species == null) {
    return (
      <View style={cellRootStyle(cellSize)} accessibilityElementsHidden>
        <View style={styles.placeholderShell}>
          <View style={[styles.placeholderImage, { width: imageSize, height: imageSize }]} />
          <View style={styles.placeholderNameGap} />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={cellRootStyle(cellSize)}
      onPress={onPress}
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
          <View key={species.id} style={imageWrapStyle} collapsable={false}>
            <Image
              key={imageKey}
              source={imageSource}
              style={[styles.image, !discovered && getSlimeSilhouetteImageStyle()]}
              resizeMode="contain"
            />
          </View>
          <View style={styles.nameWrap}>
            <FitText
              text={displayName}
              preset="slimepediaGridName"
              maxWidth={nameMaxWidth}
              style={[
                styles.name,
                discovered ? styles.nameDiscovered : styles.nameUndiscovered,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>
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
    alignSelf: 'center',
    marginBottom: -8,
    borderRadius: INNER_RADIUS,
    backgroundColor: pedia.emptySlot,
  },
  placeholderNameGap: {
    width: '100%',
    height: NAME_ROW_HEIGHT,
  },
  cardShell: {
    width: '100%',
    maxWidth: '100%',
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
    paddingHorizontal: CARD_H_PAD,
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
  },
  imageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -8,
  },
  nameWrap: {
    width: '100%',
    height: NAME_ROW_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
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
