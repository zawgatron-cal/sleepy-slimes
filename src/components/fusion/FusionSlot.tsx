import { Image, Pressable, View } from 'react-native';
import { FitText } from '@/src/components/FitText';
import type { Species } from '@/src/types';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const FUSE_SILHOUETTE = require('../../../assets/ui/fuse-slime-sillhouette-element.png');
const SLOT_NAME_ROW_HEIGHT = 24;

export type FusionSlotProps = {
  speciesId?: string;
  displayName?: string;
  onPress: () => void;
};

export function FusionSlot({ speciesId, displayName, onPress }: FusionSlotProps) {
  const filled = !!speciesId && !!displayName;

  return (
    <Pressable
      style={[styles.slotBox, filled && styles.slotBoxFilled]}
      onPress={onPress}
    >
      {filled ? (
        <>
          <Image source={getSlimeImageSource(speciesId)} style={styles.slotImage} />
          <View style={styles.slotNameWrap}>
            <FitText
              text={displayName}
              preset="fusionSlotName"
              style={styles.slotName}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>
        </>
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
  slotSilhouette: {
    width: '60%',
    height: '60%',
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
