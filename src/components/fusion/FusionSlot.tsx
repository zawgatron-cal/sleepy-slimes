import { Image, Pressable, View } from 'react-native';
import { useState } from 'react';
import { FitText } from '@/src/components/FitText';
import { SlimeSilhouetteArtwork } from '@/src/components/SlimeSilhouetteArtwork';
import { useSlimeImageCacheKey, useSlimeImageSource } from '@/src/utils/slimeAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const FUSE_SILHOUETTE = require('../../../assets/ui/fuse-slime-sillhouette-element.png');
const SLOT_NAME_ROW_HEIGHT = 24;

export type FusionSlotProps = {
  speciesId?: string;
  displayName?: string;
  /** When empty, show this species silhouette instead of the generic fuse placeholder. */
  emptySilhouetteSpeciesId?: string;
  onPress: () => void;
  disabled?: boolean;
};

export function FusionSlot({
  speciesId,
  displayName,
  emptySilhouetteSpeciesId,
  onPress,
  disabled = false,
}: FusionSlotProps) {
  const [nameRowWidth, setNameRowWidth] = useState(0);
  const filled = !!speciesId && !!displayName;
  const imageSource = useSlimeImageSource(speciesId);
  const imageKey = useSlimeImageCacheKey(speciesId);

  return (
    <Pressable
      style={[styles.slotBox, filled && styles.slotBoxFilled, disabled && styles.slotBoxDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {filled ? (
        <>
          <Image key={imageKey} source={imageSource} style={styles.slotImage} />
          <View
            style={styles.slotNameWrap}
            onLayout={(event) => {
              const width = Math.round(event.nativeEvent.layout.width);
              if (width > 0) {
                setNameRowWidth((prev) => (prev === width ? prev : width));
              }
            }}
          >
            <FitText
              text={displayName}
              preset="fusionSlotName"
              maxWidth={nameRowWidth > 0 ? nameRowWidth : undefined}
              style={styles.slotName}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            />
          </View>
        </>
      ) : emptySilhouetteSpeciesId ? (
        <SlimeSilhouetteArtwork
          speciesId={emptySilhouetteSpeciesId}
          fillColor={mainScreens.fuse.slotSilhouette}
          style={styles.slotSpeciesSilhouette}
          imageStyle={styles.slotSpeciesSilhouetteImage}
        />
      ) : (
        <Image
          source={FUSE_SILHOUETTE}
          style={styles.slotSilhouette}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      )}
    </Pressable>
  );
}

const styles = createAppStyles({
  slotBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: 150,
    aspectRatio: 1,
    backgroundColor: mainScreens.fuse.slotSurface,
    borderRadius: 24,
    borderWidth: 12,
    borderColor: mainScreens.fuse.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  slotBoxFilled: {
    backgroundColor: mainScreens.fuse.surface,
  },
  slotBoxDisabled: {
    opacity: 0.65,
  },
  slotSilhouette: {
    width: '60%',
    height: '60%',
  },
  slotSpeciesSilhouette: {
    width: '72%',
    height: '72%',
  },
  slotSpeciesSilhouetteImage: {
    width: '100%',
    height: '100%',
  },
  slotImage: { width: 100, height: 100, marginBottom: -10 },
  slotNameWrap: {
    width: '90%',
    height: SLOT_NAME_ROW_HEIGHT,
    justifyContent: 'center',
    marginBottom: 4,
  },
  slotName: {
    fontWeight: '700',
    color: mainScreens.fuse.primary,
    width: '100%',
    textAlign: 'center',
  },
});
