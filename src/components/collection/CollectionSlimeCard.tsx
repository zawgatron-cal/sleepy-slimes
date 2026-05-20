import { useId, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { FitText } from '@/src/components/FitText';
import { TIER_LABELS } from '@/src/constants/game';
import type { Tier } from '@/src/types';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { resolveTierAccent } from '@/src/theme/tierAccents';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

export type CollectionSlimeCardProps = {
  tileWidth: number;
  speciesId: string;
  name: string;
  tier?: Tier;
  onPress: () => void;
};

const BORDER = 4;
const OUTER_RADIUS = 12;
const INNER_RADIUS = OUTER_RADIUS - BORDER;
const TIER_SVG_H = 18;
const TIER_FONT = 14;
/** Baseline for `TIER_FONT` inside `TIER_SVG_H` (Itim, centered). */
const TIER_TEXT_BASELINE = 14;

export function CollectionSlimeCard({
  tileWidth,
  speciesId,
  name,
  tier,
  onPress,
}: CollectionSlimeCardProps) {
  const tierLabel = tier != null ? TIER_LABELS[tier].toLowerCase() : 'unknown';
  const tierAccent = resolveTierAccent(tier);
  const [layout, setLayout] = useState<{ w: number; h: number } | null>(null);
  const [tierRowW, setTierRowW] = useState(0);
  const rawGradId = useId();
  const safeId = rawGradId.replace(/:/g, '');
  const borderGradId = `coll-card-border-${safeId}`;
  const tierFillGradId = `coll-tier-fill-${safeId}`;

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
          <FitText
            text={name}
            preset="collectionCardName"
            style={[styles.cardName, { includeFontPadding: false }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          />
          <View
            style={styles.cardTierSvgWrap}
            onLayout={(e) => {
              const w = Math.round(e.nativeEvent.layout.width);
              if (w > 0) setTierRowW((prev) => (prev === w ? prev : w));
            }}
          >
            {tierRowW > 0 ? (
              <Svg width={tierRowW} height={TIER_SVG_H} viewBox={`0 0 ${tierRowW} ${TIER_SVG_H}`}>
                <Defs>
                  <LinearGradient
                    id={tierFillGradId}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor={tierAccent.borderTop} />
                    <Stop offset="100%" stopColor={tierAccent.borderBottom} />
                  </LinearGradient>
                </Defs>
                <SvgText
                  x={tierRowW / 2}
                  y={TIER_TEXT_BASELINE}
                  textAnchor="middle"
                  fontFamily={APP_FONT_FAMILY}
                  fontSize={TIER_FONT}
                  fontWeight="800"
                  fill={`url(#${tierFillGradId})`}
                  letterSpacing={0.3}
                >
                  {tierLabel}
                </SvgText>
              </Svg>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const CARD_FACE = mainScreens.idle.surface;

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
  cardTierSvgWrap: {
    alignSelf: 'stretch',
    marginTop: 1,
    marginBottom: 4,
    height: TIER_SVG_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
