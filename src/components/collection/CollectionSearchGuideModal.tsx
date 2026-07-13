import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLLECTION_SEARCH_GUIDE_GROUPS,
  COLLECTION_SEARCH_GUIDE_EXAMPLE,
} from '@/src/constants/collectionSearchGuide';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

type CollectionSearchGuideModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function CollectionSearchGuideModal({
  visible,
  onClose,
}: CollectionSearchGuideModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close search guide"
          >
            <Ionicons name="close" size={22} color={t.accent} />
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.title}>Search guide</Text>
            <Text style={styles.intro}>
              Example: <Text style={styles.example}>{COLLECTION_SEARCH_GUIDE_EXAMPLE}</Text>
            </Text>

            <View style={styles.list}>
              {COLLECTION_SEARCH_GUIDE_GROUPS.map((group) => (
                <View key={group.label} style={styles.row}>
                  <Text style={styles.label}>{group.label}</Text>
                  <Text style={styles.keywords}>{group.keywords}</Text>
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const t = mainScreens.collection.detailModal;

const styles = createAppStyles({
  overlay: {
    flex: 1,
    backgroundColor: t.overlay,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrap: {
    width: '100%',
    maxWidth: 340,
    overflow: 'visible',
    paddingTop: 28,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 26,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 6,
    borderColor: t.border,
    backgroundColor: t.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  card: {
    width: '100%',
    backgroundColor: t.bg,
    borderRadius: 14,
    borderWidth: 9,
    borderColor: t.border,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: t.accent,
    textAlign: 'center',
  },
  intro: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: t.accent,
    textAlign: 'center',
  },
  example: {
    fontWeight: '800',
    color: t.accent,
  },
  list: {
    gap: 6,
    paddingTop: 2,
    backgroundColor: t.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  label: {
    width: 72,
    fontSize: 13,
    fontWeight: '800',
    color: t.accent,
  },
  keywords: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: t.accent,
    lineHeight: 18,
  },
});
