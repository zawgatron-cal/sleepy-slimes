/**
 * Collection screen — detail for one owned slime instance.
 */

import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { TIER_LABELS } from '@/src/constants/game';
import type { Species } from '@/src/types';

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
            <View style={styles.modalEmojiWrap}>
              <Text style={styles.modalEmoji}>🟢</Text>
            </View>
            <Text style={styles.modalName}>{slime.species?.name ?? slime.speciesId}</Text>
            <Text style={styles.modalTier}>
              {slime.species ? TIER_LABELS[slime.species.tier] : ''}
            </Text>
            <Text style={styles.modalAcquired}>
              acquired: {new Date(slime.acquiredAt).toLocaleDateString()}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCardWrap: { width: '100%', maxWidth: 360 },
  modalCard: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalEmojiWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  modalEmoji: { fontSize: 56 },
  modalName: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 4 },
  modalTier: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 12 },
  modalAcquired: { fontSize: 14, color: '#333' },
});
