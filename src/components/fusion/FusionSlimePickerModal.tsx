/**
 * Fusion screen — pick a slime (unnamed grouped by species, named slimes separate).
 */

import { View, Text, Pressable, Modal, ScrollView, Image } from 'react-native';
import { TIER_LABELS } from '@/src/constants/game';
import { useSlimeImageCacheKey, useSlimeImageSource } from '@/src/utils/slimeAssets';
import type { FusionPickerRow } from '@/src/utils/fusionPickerRows';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { resolveTierColor } from '@/src/theme/tierAccents';

export type { FusionPickerRow };

export type FusionSlimePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  rows: FusionPickerRow[];
  showFavorited: boolean;
  onShowFavoritedChange: (value: boolean) => void;
  onPickSlime: (slimeId: string) => void;
};

function FusionPickerSlimeImage({ speciesId }: { speciesId: string }) {
  const source = useSlimeImageSource(speciesId);
  const imageKey = useSlimeImageCacheKey(speciesId);
  return <Image key={imageKey} source={source} style={styles.pickerImage} />;
}

export function FusionSlimePickerModal({
  visible,
  onClose,
  rows,
  showFavorited,
  onShowFavoritedChange,
  onPickSlime,
}: FusionSlimePickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Pick a slime</Text>
            <Pressable
              style={styles.showFavoritedRow}
              onPress={() => onShowFavoritedChange(!showFavorited)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: showFavorited }}
              accessibilityLabel="Show favorited"
            >
              <Text style={styles.showFavoritedLabel}>Show favorited</Text>
              <View style={[styles.checkbox, showFavorited && styles.checkboxChecked]}>
                {showFavorited ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
            </Pressable>
          </View>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {rows.length === 0 ? (
              <Text style={styles.pickerEmpty}>
                {showFavorited
                  ? 'No available slimes.'
                  : 'No slimes available. Enable Show favorited to include favorites.'}
              </Text>
            ) : (
              rows.map(({ key, slimeId, species: sp, displayName, count }) => (
                <Pressable
                  key={key}
                  style={styles.pickerRow}
                  onPress={() => onPickSlime(slimeId)}
                >
                  <FusionPickerSlimeImage speciesId={sp.id} />
                  <View style={styles.pickerMetaRow}>
                    <View style={styles.pickerMeta}>
                      <Text style={styles.pickerName} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text style={[styles.pickerTier, { color: resolveTierColor(sp.tier) }]}>
                        {TIER_LABELS[sp.tier]}
                      </Text>
                    </View>
                    {count != null ? (
                      <Text style={styles.pickerCount}>x{count}</Text>
                    ) : null}
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
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  pickerTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#EC8E91',
  },
  showFavoritedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  showFavoritedLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: '#EC8E91',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: '#EC8E91',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EC8E91',
  },
  checkboxMark: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '900',
    color: '#F1E2E4',
    marginTop: -1,
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
    minWidth: 0,
  },
  pickerName: {
    fontSize: 22,
    lineHeight: 20,
    fontWeight: '800',
    color: '#EC8E91',
    marginTop: 4,
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
