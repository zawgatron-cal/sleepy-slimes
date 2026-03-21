/**
 * Fusion screen — pick a species from owned slimes (counts per species).
 */

import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { TIER_LABELS } from '@/src/constants/game';
import type { Species } from '@/src/types';

export type FusionPickerRow = { species: Species; count: number };

export type FusionSlimePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  rows: FusionPickerRow[];
  onPickSpecies: (speciesId: string) => void;
};

export function FusionSlimePickerModal({
  visible,
  onClose,
  rows,
  onPickSpecies,
}: FusionSlimePickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.pickerTitle}>Pick a slime</Text>
          <ScrollView style={styles.pickerList}>
            {rows.length === 0 ? (
              <Text style={styles.pickerEmpty}>No available slimes.</Text>
            ) : (
              rows.map(({ species: sp, count }) => (
                <Pressable
                  key={sp.id}
                  style={styles.pickerRow}
                  onPress={() => onPickSpecies(sp.id)}
                >
                  <Text style={styles.pickerEmoji}>🙂</Text>
                  <View style={styles.pickerMetaRow}>
                    <View style={styles.pickerMeta}>
                      <Text style={styles.pickerName}>{sp.name}</Text>
                      <Text style={styles.pickerTier}>{TIER_LABELS[sp.tier]}</Text>
                    </View>
                    <Text style={styles.pickerCount}>x{count}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
          <Pressable style={styles.pickerClose} onPress={onClose}>
            <Text style={styles.pickerCloseText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
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
  pickerCard: { width: '92%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 10, padding: 14 },
  pickerTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 10 },
  pickerList: { maxHeight: 360 },
  pickerEmpty: { color: '#666', paddingVertical: 14 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerEmoji: { fontSize: 26, width: 44, textAlign: 'center' },
  pickerMetaRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerMeta: { flexShrink: 1, paddingRight: 8 },
  pickerName: { fontSize: 14, fontWeight: '700', color: '#111' },
  pickerTier: { fontSize: 12, color: '#666', marginTop: 2 },
  pickerCount: { fontSize: 13, fontWeight: '700', color: '#111' },
  pickerClose: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  pickerCloseText: { fontSize: 14, fontWeight: '700', color: '#111' },
});
