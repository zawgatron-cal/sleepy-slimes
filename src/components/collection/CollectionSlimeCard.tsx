import { useId, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { TIER_LABELS } from '@/src/constants/game';
import type { Tier } from '@/src/types';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

export type CollectionSlimeCardProps = {
  tileWidth: number;
  speciesId: string;
  name: string;
  tier?: Tier;
  onPress: () => void;
};

/** "Sun Slime" / "Grass Slime"–length names use 18; longer names step down; `adjustsFontSizeToFit` can shrink more. */
function resolveCollectionCardNameFontSize(name: string): number {
  const n = name.trim().length;
  if (n <= 11) return 18;
  if (n >= 22) return 10;
  const t = (n - 11) / (22 - 11);
  return Math.round(18 + (10 - 18) * t);
}

const BORDER = 4;
const OUTER_RADIUS = 12;
const INNER_RADIUS = OUTER_RADIUS - BORDER;

export function CollectionSlimeCard({
  tileWidth,
  speciesId,
  name,
  tier,
  onPress,
}: CollectionSlimeCardProps) {
  const tierLabel = tier != null ? TIER_LABELS[tier].toLowerCase() : 'unknown';
  const tierAccent = resolveTierAccent(tier);
  const nameFontSize = resolveCollectionCardNameFontSize(name);
  const [layout, setLayout] = useState<{ w: number; h: number } | null>(null);
  const rawGradId = useId();
  const borderGradId = `coll-card-border-${rawGradId.replace(/:/g, '')}`;

  return (
    <Pressable style={{ width: tileWidth }} onPress={onPress}>
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
              <LinearGradient
                id={borderGradId}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
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
          <View style={styles.cardImageWrap}>
            <Image
              source={getSlimeImageSource(speciesId)}
              style={styles.cardImage}
              resizeMode="contain"
            />
          </View>
          <Text
            style={[
              styles.cardName,
              {
                fontSize: nameFontSize,
                lineHeight: nameFontSize + 2,
                includeFontPadding: false,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          >
            {name}
          </Text>
          <Text
            style={[
              styles.cardTier,
              { color: tierAccent.tierText, includeFontPadding: false },
            ]}
            numberOfLines={1}
          >
            {tierLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const CARD_FACE = mainScreens.idle.surface;

function resolveTierAccent(tier?: Tier): {
  borderTop: string;
  borderBottom: string;
  tierText: string;
} {
  switch (tier) {
    case 1:
      return {
        borderTop: '#7AEB8F',
        borderBottom: '#1B9E33',
        tierText: '#1CCB74',
      };
    case 2:
      return {
        borderTop: '#FFB14A',
        borderBottom: '#D94816',
        tierText: '#ED9424',
      };
    case 3:
      return {
        borderTop: '#8EC5FF',
        borderBottom: '#2563D4',
        tierText: '#3F8DFF',
      };
    case 4:
      return {
        borderTop: '#D4B0FF',
        borderBottom: '#6B3AC7',
        tierText: '#A15DFF',
      };
    default:
      return {
        borderTop: mainScreens.idle.specialTextBorder,
        borderBottom: mainScreens.idle.borderOne,
        tierText: mainScreens.idle.primaryText,
      };
  }
}

const styles = createAppStyles({
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
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -6,
    overflow: 'hidden',
  },
  /** Fills the square; wrap uses overflow hidden so art can feel large without overlapping labels. */
  cardImage: { width: '100%', height: '100%' },
  cardName: {
    alignSelf: 'stretch',
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    marginBottom: -4,
    textAlign: 'center',
    maxWidth: '100%',
  },
  /** Tight line box: `lineHeight` must stay ≥ `fontSize` or glyphs clip. Trim space below the card with `paddingBottom` instead. */
  cardTier: {
    marginTop: 1,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
    textTransform: 'lowercase',
    letterSpacing: 0.3,
    marginBottom: 4
  },
});
