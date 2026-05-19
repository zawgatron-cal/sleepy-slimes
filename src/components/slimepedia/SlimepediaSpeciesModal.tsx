/**
 * Slimepedia — species detail + lore text.
 */

import { View, Text, Pressable, Modal, Image } from 'react-native';
import { TIER_LABELS } from '@/src/constants/game';
import type { Species } from '@/src/types';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

export type SlimepediaSpeciesModalProps = {
  visible: boolean;
  onClose: () => void;
  species: Species;
  description: string;
  fusionHint: string;
};

export function SlimepediaSpeciesModal({
  visible,
  onClose,
  species,
  description,
  fusionHint,
}: SlimepediaSpeciesModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCardWrap} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalCard}>
            <View style={styles.modalEmojiWrap}>
              <Image source={getSlimeImageSource(species.id)} style={styles.modalImage} />
            </View>
            <Text style={styles.modalName}>{species.name}</Text>
            <Text style={styles.modalTier}>{TIER_LABELS[species.tier]}</Text>
            <Text style={styles.modalSectionLabel}>Description</Text>
            <Text style={styles.modalBodyText}>{description}</Text>
            <Text style={styles.modalSectionLabel}>Fusion hint</Text>
            <Text style={styles.modalBodyText}>{fusionHint}</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pedia = mainScreens.slimepedia;

const styles = createAppStyles({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCardWrap: { width: '100%', maxWidth: 360 },
  modalCard: {
    backgroundColor: pedia.ledge,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: pedia.setChrome,
  },
  modalEmojiWrap: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalImage: { width: 66, height: 66 },
  modalName: {
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: pedia.slimeName,
    marginBottom: 4,
  },
  modalTier: {
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: pedia.setChrome,
    marginBottom: 16,
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: pedia.setChrome,
    marginTop: 8,
    marginBottom: 4,
  },
  modalBodyText: {
    fontSize: 13,
    color: pedia.setChrome,
  },
});
