/**
 * Slimepedia — full-screen species detail (description + fusion hints).
 */

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Species } from '@/src/types';
import type { Tier } from '@/src/constants/game';
import { getSlimeImageSource, getSlimeSilhouetteImageStyle } from '@/src/utils/slimeAssets';
import {
  getSlimepediaDescription,
  getSlimepediaFusionHints,
  UNDISCOVERED_COPY,
  UNDISCOVERED_FUSION_HINT_COUNT,
  type SlimepediaEntry,
} from '@/src/utils/slimepediaContent';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { resolveTierAccent } from '@/src/theme/tierAccents';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';
import { SLIMEPEDIA_DETAIL_TILE } from '@/src/constants/slimepediaAssets';
import { buildPointyTopHexTileLayout } from '@/src/utils/hexTileLayout';

const pedia = mainScreens.slimepedia;
const H_PAD = 20;
const CARD_PAD = 14;
const TITLE_STROKE = 2;
/** "Grass Slime" at this size fits the card width; longer names scale down. */
const TITLE_REF_NAME = 'Grass Slime';
const TITLE_REF_LEN = TITLE_REF_NAME.length;
const TITLE_REF_FONT = 40;
const TITLE_MIN_FONT = 20;
const TITLE_MAX_FONT = 44;
const TIER_STAR_COUNT = 4;

type DetailTitleMetrics = {
  fontSize: number;
  viewportHeight: number;
  baselineY: number;
};

function resolveDetailTitleMetrics(name: string, maxWidth: number): DetailTitleMetrics {
  const n = name.trim().length;
  let fontSize = TITLE_REF_FONT;

  if (n > TITLE_REF_LEN) {
    const span = 20;
    const t = Math.min(1, (n - TITLE_REF_LEN) / span);
    fontSize = Math.round(TITLE_REF_FONT + t * (TITLE_MIN_FONT - TITLE_REF_FONT));
  } else if (n < TITLE_REF_LEN) {
    const t = (TITLE_REF_LEN - n) / TITLE_REF_LEN;
    fontSize = Math.round(TITLE_REF_FONT + t * (TITLE_MAX_FONT - TITLE_REF_FONT));
  }

  const estWidth = n * fontSize * 0.52;
  if (maxWidth > 0 && estWidth > maxWidth) {
    fontSize = Math.max(TITLE_MIN_FONT, Math.floor(maxWidth / (n * 0.52)));
  }

  fontSize = Math.min(TITLE_MAX_FONT, Math.max(TITLE_MIN_FONT, fontSize));

  return {
    fontSize,
    viewportHeight: Math.round(fontSize * 1.12),
    baselineY: Math.round(fontSize * 0.9),
  };
}
/** Match summary honeycomb — 3 tiles across. */
const DETAIL_HEX_TILES_ACROSS = 3;
const DETAIL_HEX_HORIZONTAL_PITCH_SCALE = 1.14;

export type SlimepediaSpeciesDetailProps = {
  species: Species;
  discovered: boolean;
  entry?: SlimepediaEntry;
  onBack: () => void;
};

function SpeciesTitleLabel({ name, width }: { name: string; width: number }) {
  const { fontSize, viewportHeight, baselineY } = useMemo(
    () => resolveDetailTitleMetrics(name, width),
    [name, width],
  );

  return (
    <Svg width={width} height={viewportHeight}>
      <SvgText
        x={width / 2}
        y={baselineY}
        textAnchor="middle"
        fontFamily={APP_FONT_FAMILY}
        fontSize={fontSize}
        fontWeight="900"
        stroke={pedia.detailTitleStroke}
        strokeWidth={TITLE_STROKE}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {name}
      </SvgText>
      <SvgText
        x={width / 2}
        y={baselineY}
        textAnchor="middle"
        fontFamily={APP_FONT_FAMILY}
        fontSize={fontSize}
        fontWeight="900"
        fill={pedia.detailText}
      >
        {name}
      </SvgText>
    </Svg>
  );
}

function TierStars({ tier }: { tier: number }) {
  const accent = resolveTierAccent(tier as (typeof Tier)[keyof typeof Tier]);
  const filledColor = accent.borderBottom;
  return (
    <View style={styles.starsRow} accessibilityLabel={`Tier ${tier} of ${TIER_STAR_COUNT}`}>
      {Array.from({ length: TIER_STAR_COUNT }, (_, i) => {
        const filled = i < tier;
        return (
          <Text
            key={i}
            style={[styles.star, { color: filled ? filledColor : pedia.detailStarEmpty }]}
          >
            ★
          </Text>
        );
      })}
    </View>
  );
}

function DetailBackground({ width, height }: { width: number; height: number }) {
  const displayTilePx = width / DETAIL_HEX_TILES_ACROSS;
  const hexPlacements = useMemo(
    () =>
      buildPointyTopHexTileLayout(width, height, displayTilePx, {
        horizontalPitchScale: DETAIL_HEX_HORIZONTAL_PITCH_SCALE,
      }),
    [width, height, displayTilePx],
  );

  return (
    <View style={[styles.hexLayer, { width, height }]} pointerEvents="none">
      {hexPlacements.map(({ key, left, top }) => (
        <Image
          key={key}
          source={SLIMEPEDIA_DETAIL_TILE}
          style={[
            styles.hexTile,
            { left, top, width: displayTilePx, height: displayTilePx },
          ]}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

export function SlimepediaSpeciesDetail({
  species,
  discovered,
  entry,
  onBack,
}: SlimepediaSpeciesDetailProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [cardWidth, setCardWidth] = useState(() => Math.max(280, windowWidth - H_PAD * 2));
  const displayName = discovered ? species.name : UNDISCOVERED_COPY;
  const description = discovered ? getSlimepediaDescription(entry) : UNDISCOVERED_COPY;
  const fusionHints = discovered
    ? getSlimepediaFusionHints(entry)
    : Array.from({ length: UNDISCOVERED_FUSION_HINT_COUNT }, () => UNDISCOVERED_COPY);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <DetailBackground width={windowWidth} height={windowHeight} />

        <View style={styles.content}>
          <Pressable
            style={styles.backBtn}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.cardCenterWrap}>
            <View
              style={styles.card}
              onLayout={(e) => {
                const w = Math.floor(e.nativeEvent.layout.width);
                if (w > 0 && w !== cardWidth) setCardWidth(w);
              }}
            >
              <View style={styles.titleWrap}>
                <SpeciesTitleLabel name={displayName} width={cardWidth - CARD_PAD * 2} />
              </View>

              <TierStars tier={species.tier} />

              <View style={styles.imageWrap}>
                <Image
                  source={getSlimeImageSource(species.id)}
                  style={[
                    styles.slimeImage,
                    !discovered && getSlimeSilhouetteImageStyle(),
                  ]}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.sectionHeading}>Description</Text>
                <View style={styles.textBox}>
                  <Text
                    style={styles.textBoxBody}
                    numberOfLines={4}
                    ellipsizeMode="tail"
                  >
                    {description}
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>Fusion Hints</Text>
                {fusionHints.map((hint, index) => (
                  <View
                    key={index}
                    style={[styles.textBox, index > 0 && styles.textBoxSpaced]}
                  >
                    <Text
                      style={styles.textBoxBody}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {hint}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = createAppStyles({
  safeArea: {
    flex: 1,
    backgroundColor: pedia.detailBg,
  },
  root: {
    flex: 1,
    backgroundColor: pedia.detailBg,
  },
  hexLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  hexTile: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
    minHeight: 0,
  },
  cardCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingRight: 12,
    marginBottom: 5,
  },
  backText: {
    fontSize: 20,
    fontWeight: '700',
    color: "#000000",
  },
  card: {
    backgroundColor: pedia.detailCard,
    borderRadius: 22,
    paddingHorizontal: CARD_PAD,
    paddingTop: 12,
    paddingBottom: 13,
    alignItems: 'center',
    flexShrink: 1,
    maxHeight: '100%',
  },
  cardBody: {
    alignSelf: 'stretch',
    flexShrink: 1,
    minHeight: 0,
  },
  titleWrap: {
    width: '100%',
    marginBottom: 4,
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: -10,
  },
  star: {
    fontSize: 22,
    lineHeight: 24,
  },
  imageWrap: {
    marginBottom: -28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slimeImage: {
    width: 160,
    height: 160,
  },
  sectionHeading: {
    alignSelf: 'stretch',
    fontSize: 17,
    fontWeight: '800',
    color: pedia.detailLabel,
    marginBottom: 2,
    textAlign: 'left',
  },
  textBox: {
    alignSelf: 'stretch',
    backgroundColor: pedia.detailPill,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  textBoxSpaced: {
    marginTop: -2,
  },
  textBoxBody: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    color: pedia.detailText,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});
