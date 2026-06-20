/**
 * Confirm releasing a slime for tier-based candies.
 */

import { View, Text, Pressable, Modal } from 'react-native';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const t = mainScreens.collection.detailModal;

export type SlimeConvertConfirmModalProps = {
  visible: boolean;
  slimeName: string;
  tierLabel: string;
  candyReward: number;
  isEquipped: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function SlimeConvertConfirmModal({
  visible,
  slimeName,
  tierLabel,
  candyReward,
  isEquipped,
  onClose,
  onConfirm,
}: SlimeConvertConfirmModalProps) {
  const candyWord = candyReward === 1 ? 'candy' : 'candies';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Convert to candies?</Text>
          <Text style={styles.body}>
            <Text style={styles.bodyStrong}>{slimeName}</Text> will be released forever.
          </Text>
          <View style={styles.rewardRow}>
            <Text style={styles.rewardText}>You&apos;ll receive</Text>
            <Text style={styles.rewardAmount}>{candyReward}</Text>
            <CandyGlyph size={28} />
          </View>
          <Text style={styles.tierHint}>
            {tierLabel} slimes convert to {candyReward} {candyWord}.
          </Text>
          {isEquipped ? (
            <Text style={styles.equippedHint}>This slime is currently equipped as your buddy.</Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => void onConfirm()}>
              <Text style={styles.primaryBtnText}>Convert</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = createAppStyles({
  overlay: {
    flex: 1,
    backgroundColor: t.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: t.bg,
    borderRadius: 14,
    borderWidth: 6,
    borderColor: t.border,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },
  title: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 26,
    fontWeight: '800',
    color: t.accent,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 17,
    fontWeight: '600',
    color: t.accent,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 14,
  },
  bodyStrong: {
    fontWeight: '800',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rewardText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: t.accent,
  },
  rewardAmount: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 28,
    fontWeight: '900',
    color: t.accent,
  },
  tierHint: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    color: t.variantText,
    textAlign: 'center',
    marginBottom: 8,
  },
  equippedHint: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: t.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: t.accent,
    backgroundColor: t.surface,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    color: t.accent,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: t.accent,
    backgroundColor: t.accent,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    color: t.levelUpText,
  },
});
