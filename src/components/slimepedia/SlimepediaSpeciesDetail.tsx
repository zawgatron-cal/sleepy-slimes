/**
 * Slimepedia — full-screen species detail (description + fusion hints).
 */

import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OutlinedSvgLabel } from '@/src/components/OutlinedSvgLabel';
import type { Species } from '@/src/types';
import type { Tier } from '@/src/constants/game';
import {
  useSlimeImageCacheKey,
  useSlimeImageSource,
  getSlimeSilhouetteImageStyle,
} from '@/src/utils/slimeAssets';
import {
  getSlimepediaDescription,
  getSlimepediaFoundIn,
  getSlimepediaFusionHints,
  UNDISCOVERED_COPY,
  UNDISCOVERED_FUSION_HINT_COUNT,
  type SlimepediaEntry,
} from '@/src/utils/slimepediaContent';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { resolveTierColor } from '@/src/theme/tierAccents';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { SLIMEPEDIA_DETAIL_TILE } from '@/src/constants/slimepediaAssets';
import { HexTileBackground } from '@/src/components/HexTileBackground';

const pedia = mainScreens.slimepedia;
const H_PAD = 20;
const CARD_PAD = 14;
const TITLE_STROKE = 2;
const TIER_STAR_COUNT = 4;
const DETAIL_HEX_TILES_ACROSS = 3;

export type SlimepediaSpeciesDetailProps = {
  species: Species;
  discovered: boolean;
  entry?: SlimepediaEntry;
  onBack: () => void;
};

function SpeciesTitleLabel({ name, width }: { name: string; width: number }) {
  return (
    <OutlinedSvgLabel
      text={name}
      fit="slimepediaDetailTitle"
      strokeWidth={TITLE_STROKE}
      strokeColor={pedia.detail.titleStroke}
      fillColor={pedia.detail.text}
      defaultWidth={width}
      style={styles.speciesTitleSvg}
    />
  );
}

function TierStar({ filled, filledColor }: { filled: boolean; filledColor: string }) {
  const fill = filled ? filledColor : pedia.detail.starEmpty;
  return (
    <View style={styles.starWrap} importantForAccessibility="no-hide-descendants">
      <View style={styles.starGlyphLayer} pointerEvents="none">
        <Text style={[styles.starGlyph, styles.starBorder]} accessible={false}>
          ★
        </Text>
      </View>
      <View style={styles.starGlyphLayer} pointerEvents="none">
        <Text style={[styles.starGlyph, styles.starFill, { color: fill }]} accessible={false}>
          ★
        </Text>
      </View>
    </View>
  );
}

function TierStars({ tier }: { tier: number }) {
  const filledColor = resolveTierColor(tier as (typeof Tier)[keyof typeof Tier]);
  return (
    <View style={styles.starsRow} accessibilityLabel={`Tier ${tier} of ${TIER_STAR_COUNT}`}>
      {Array.from({ length: TIER_STAR_COUNT }, (_, i) => (
        <TierStar key={i} filled={i < tier} filledColor={filledColor} />
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
  const imageSource = useSlimeImageSource(species.id);
  const imageKey = useSlimeImageCacheKey(species.id);
  const displayName = discovered ? species.name : UNDISCOVERED_COPY;
  const description = discovered ? getSlimepediaDescription(entry) : UNDISCOVERED_COPY;
  const foundIn = discovered ? getSlimepediaFoundIn(species) : UNDISCOVERED_COPY;
  const fusionHints = discovered
    ? getSlimepediaFusionHints(entry)
    : Array.from({ length: UNDISCOVERED_FUSION_HINT_COUNT }, () => UNDISCOVERED_COPY);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <HexTileBackground
          width={windowWidth}
          height={windowHeight}
          tileSource={SLIMEPEDIA_DETAIL_TILE}
          tilesAcross={DETAIL_HEX_TILES_ACROSS}
        />

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
                  key={imageKey}
                  source={imageSource}
                  style={[
                    styles.slimeImage,
                    !discovered && getSlimeSilhouetteImageStyle(),
                  ]}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>

              <ScrollView
                style={styles.cardBodyScroll}
                contentContainerStyle={styles.cardBody}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Text style={styles.sectionHeading}>Description</Text>
                <View style={styles.textBox}>
                  <Text style={styles.textBoxBody}>{description}</Text>
                </View>

                <Text style={styles.sectionHeading}>Found in</Text>
                <View style={styles.textBox}>
                  <Text
                    style={styles.textBoxBody}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {foundIn}
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
              </ScrollView>
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
    backgroundColor: pedia.detail.bg,
  },
  root: {
    flex: 1,
    backgroundColor: pedia.detail.bg,
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
    backgroundColor: pedia.detail.surface,
    borderRadius: 22,
    paddingHorizontal: CARD_PAD,
    paddingTop: 12,
    paddingBottom: 13,
    alignItems: 'center',
    flexShrink: 1,
    maxHeight: '100%',
  },
  cardBodyScroll: {
    alignSelf: 'stretch',
    flexShrink: 1,
    minHeight: 0,
  },
  cardBody: {
    alignSelf: 'stretch',
    paddingBottom: 2,
  },
  titleWrap: {
    width: '100%',
    marginBottom: 4,
    alignItems: 'center',
  },
  speciesTitleSvg: {
    width: '100%',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: -10,
  },
  starWrap: {
    width: 30,
    height: 30,
  },
  starGlyphLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starGlyph: {
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  starBorder: {
    fontSize: 30,
    lineHeight: 30,
    color: pedia.detail.titleStroke,
  },
  starFill: {
    fontSize: 22,
    lineHeight: 22,
  },
  imageWrap: {
    marginBottom: -28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slimeImage: {
    width: 140,
    height: 140,
  },
  sectionHeading: {
    alignSelf: 'stretch',
    fontSize: 17,
    fontWeight: '800',
    color: pedia.detail.label,
    marginBottom: 2,
    textAlign: 'left',
  },
  textBox: {
    alignSelf: 'stretch',
    backgroundColor: pedia.detail.pill,
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
    color: pedia.detail.text,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});
