import { Image, Pressable, Text } from 'react-native';
import type { Species } from '@/src/types';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const FUSE_SILHOUETTE = require('../../../assets/ui/fuse-slime-sillhouette-element.png');

export type FusionSlotProps = {
  species?: Species;
  onPress: () => void;
};

function resolveSlotNameFontSize(name: string): number {
  const n = name.trim().length;
  if (n <= 11) return 22; // "Grass Slime" baseline
  if (n >= 22) return 12;
  const t = (n - 11) / (22 - 11);
  return Math.round(22 + (12 - 22) * t);
}

export function FusionSlot({ species, onPress }: FusionSlotProps) {
  return (
    <Pressable
      style={[styles.slotBox, species && styles.slotBoxFilled]}
      onPress={onPress}
    >
      {species ? (
        <>
          <Image source={getSlimeImageSource(species.id)} style={styles.slotImage} />
          <Text
            style={[styles.slotName, { fontSize: resolveSlotNameFontSize(species.name) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          >
            {species.name}
          </Text>
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
  slotName: {
    fontWeight: '700',
    color: mainScreens.fuse.primary,
    maxWidth: '100%',
    textAlign: 'center',
  },
});
