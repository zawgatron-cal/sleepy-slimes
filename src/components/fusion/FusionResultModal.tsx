/**
 * Fusion screen — result after a successful fuse.
 */

import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { TIER_LABELS } from '@/src/constants/game';
import type { Species } from '@/src/types';

export type FusionResultModalProps = {
  visible: boolean;
  onDismiss: () => void;
  resultSpecies: Species | null;
};

export function FusionResultModal({ visible, onDismiss, resultSpecies }: FusionResultModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={styles.resultCardWrap}>
          <Text style={styles.resultHeader}>Fusion Result Modal</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultYouGot}>You Got:</Text>
            <View style={styles.resultIcon}>
              <Text style={styles.resultIconText}>🙂</Text>
            </View>
            <Text style={styles.resultName} numberOfLines={2}>
              {resultSpecies?.name ?? '—'}
            </Text>
            <Text style={styles.resultTier}>
              {resultSpecies ? TIER_LABELS[resultSpecies.tier] : ''}
            </Text>
            <Pressable style={styles.resultFuseBtn} onPress={onDismiss}>
              <Text style={styles.resultFuseText}>Yay!</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  resultCardWrap: { width: '92%', maxWidth: 420 },
  resultHeader: { color: '#cfcfcf', fontSize: 16, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  resultCard: { backgroundColor: '#d9d9d9', padding: 18, alignItems: 'center' },
  resultYouGot: {
    alignSelf: 'flex-start',
    fontSize: 28,
    fontWeight: '900',
    color: '#111',
    marginBottom: 10,
  },
  resultIcon: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 6,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: '#d9d9d9',
  },
  resultIconText: { fontSize: 56 },
  resultName: { fontSize: 22, fontWeight: '900', color: '#111', textAlign: 'center' },
  resultTier: { fontSize: 18, fontWeight: '800', color: '#111', marginTop: 4, marginBottom: 12 },
  resultFuseBtn: { width: '100%', backgroundColor: '#cfcfcf', paddingVertical: 12, alignItems: 'center' },
  resultFuseText: { fontSize: 22, fontWeight: '900', color: '#111' },
});
