import { Modal, Pressable, Text, View } from 'react-native';
import { StreakGlyph } from '@/src/components/StreakGlyph';
import {
  STREAK_INFO_GRACE,
  STREAK_INFO_ICON_LEGEND,
  STREAK_INFO_INTRO,
  STREAK_INFO_TITLE,
} from '@/src/constants/streak';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const t = mainScreens.idle;

const LEGEND_ICON_SIZE = 40;

export type StreakInfoModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function StreakInfoModal({ visible, onClose }: StreakInfoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{STREAK_INFO_TITLE}</Text>
          <Text style={styles.body}>{STREAK_INFO_INTRO}</Text>

          <View style={styles.legendRow}>
            {STREAK_INFO_ICON_LEGEND.map((item) => (
              <View key={item.variant} style={styles.legendItem}>
                <StreakGlyph variant={item.variant} size={LEGEND_ICON_SIZE} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>{STREAK_INFO_GRACE}</Text>

          <Pressable style={styles.button} onPress={onClose} accessibilityRole="button">
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = createAppStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(60, 40, 40, 0.35)',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: t.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 8,
    borderColor: t.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: t.primaryText,
    marginBottom: 8,
  },
  body: {
    color: t.primaryText,
    fontWeight: '600',
    lineHeight: 20,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 14,
  },
  legendItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  legendLabel: {
    color: t.primaryText,
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: 14,
    backgroundColor: t.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: t.specialTextFill,
    fontWeight: '800',
  },
});
