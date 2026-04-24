/**
 * Collection screen — detail for one owned slime instance.
 */

import { View, Text, Pressable, Modal, Image } from 'react-native';
import { TIER_LABELS } from '@/src/constants/game';
import type { Species } from '@/src/types';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';
import Svg, { Text as SvgText } from 'react-native-svg';

export type CollectionSlimeDetail = {
  speciesId: string;
  acquiredAt: number;
  species?: Species;
};

export type CollectionSlimeDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  slime: CollectionSlimeDetail;
};

export function CollectionSlimeDetailModal({ visible, onClose, slime }: CollectionSlimeDetailModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCardWrap} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalCard}>
            <View style={styles.titleWrap}>
              <Svg width="100%" height={52}>
                <SvgText
                  x="50%"
                  y={40}
                  textAnchor="middle"
                  fontFamily={APP_FONT_FAMILY}
                  fontSize={42}
                  fontWeight="900"
                  stroke={mainScreens.idle.specialTextBorder}
                  strokeWidth={2}
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                >
                  Slime
                </SvgText>
                <SvgText
                  x="50%"
                  y={40}
                  textAnchor="middle"
                  fontFamily={APP_FONT_FAMILY}
                  fontSize={42}
                  fontWeight="900"
                  fill={mainScreens.idle.specialTextFill}
                >
                  Slime
                </SvgText>
              </Svg>
            </View>
            <View style={styles.modalEmojiWrap}>
              <Image source={getSlimeImageSource(slime.speciesId)} style={styles.modalImage} />
            </View>
            <Text style={styles.modalName}>{slime.species?.name ?? slime.speciesId}</Text>
            <Text style={styles.modalTier}>
              {slime.species ? TIER_LABELS[slime.species.tier] : ''}
            </Text>
            <Text style={styles.modalAcquired}>
              acquired: {new Date(slime.acquiredAt).toLocaleDateString()}
            </Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = createAppStyles({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(83, 60, 60, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCardWrap: { width: '100%', maxWidth: 360 },
  modalCard: {
    backgroundColor: mainScreens.idle.bg,
    borderRadius: 20,
    borderWidth: 6,
    borderColor: mainScreens.idle.borderOne,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  titleWrap: {
    width: '100%',
    marginBottom: 4,
  },
  modalEmojiWrap: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: mainScreens.idle.surface,
    borderWidth: 4,
    borderColor: mainScreens.idle.borderOne,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalImage: { width: 72, height: 72 },
  modalName: { fontSize: 24, fontWeight: '800', color: mainScreens.idle.primaryText, marginBottom: 2 },
  modalTier: { fontSize: 18, fontWeight: '700', color: mainScreens.idle.primaryText, marginBottom: 10 },
  modalAcquired: { fontSize: 14, color: mainScreens.idle.primaryText, marginBottom: 16 },
  closeButton: {
    minWidth: 132,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: mainScreens.idle.surface,
    borderWidth: 4,
    borderColor: mainScreens.idle.borderOne,
    alignItems: 'center',
  },
  closeButtonText: { fontSize: 20, fontWeight: '800', color: mainScreens.idle.primaryText },
});
