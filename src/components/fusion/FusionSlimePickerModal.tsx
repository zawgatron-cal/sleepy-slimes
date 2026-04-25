/**
 * Fusion screen — pick a species from owned slimes (counts per species).
 */

import { View, Text, Pressable, Modal, ScrollView, Image } from 'react-native';
import { TIER_LABELS } from '@/src/constants/game';
import type { Species } from '@/src/types';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { mainScreens } from '@/src/theme/mainScreensTheme';

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
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {rows.length === 0 ? (
              <Text style={styles.pickerEmpty}>No available slimes.</Text>
            ) : (
              rows.map(({ species: sp, count }) => (
                <Pressable
                  key={sp.id}
                  style={styles.pickerRow}
                  onPress={() => onPickSpecies(sp.id)}
                >
                  <Image source={getSlimeImageSource(sp.id)} style={styles.pickerImage} />
                  <View style={styles.pickerMetaRow}>
                    <View style={styles.pickerMeta}>
                      <Text style={styles.pickerName}>{sp.name}</Text>
                      <Text style={[styles.pickerTier, { color: resolveTierColor(sp.tier) }]}>
                        {TIER_LABELS[sp.tier]}
                      </Text>
                    </View>
                    <Text style={styles.pickerCount}>x{count}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
          <Pressable style={styles.pickerClose} onPress={onClose} hitSlop={8}>
            <Text style={styles.pickerCloseText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function resolveTierColor(tier: Species['tier']): string {
  if (tier === 1) return '#2EC968';
  if (tier === 2) return '#ED9424';
  if (tier === 3) return '#3F8DFF';
  if (tier === 4) return '#A15DFF';
  return mainScreens.fuse.primaryText;
}

const styles = createAppStyles({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#F1E2E4',
    borderRadius: 18,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
  },
  pickerTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#EC8E91',
    marginBottom: 10,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerEmpty: {
    color: '#EC8E91',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#F2BFC4',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  pickerImage: {
    width: 50,
    height: 50,
    marginRight: 4,
  },
  pickerMetaRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerMeta: {
    flexShrink: 1,
    paddingRight: 8,
  },
  pickerName: {
    fontSize: 22,
    lineHeight: 20,
    fontWeight: '800',
    color: '#EC8E91',
    marginTop: 4
  },
  pickerTier: {
    fontSize: 14,
    lineHeight: 16,
    marginTop: -3,
  },
  pickerCount: {
    fontSize: 22,
    lineHeight: 20,
    fontWeight: '800',
    color: '#EC8E91',
    marginRight: 8,
  },
  pickerClose: {
    marginTop: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  pickerCloseText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#EC8E91',
  },
});
