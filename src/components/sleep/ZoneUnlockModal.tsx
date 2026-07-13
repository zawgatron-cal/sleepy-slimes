import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { FitText } from '@/src/components/FitText';
import { TutorialNpcDialoguePanel } from '@/src/components/tutorial/TutorialNpcDialogue';
import type { TutorialDialogueMessage } from '@/src/components/tutorial/TutorialNpcDialogue';
import { Tier, TIER_LABELS } from '@/src/constants/game';
import type { SleepZoneView } from '@/src/utils/zoneUnlock';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';
import { resolveTierColor } from '@/src/theme/tierAccents';

const t = mainScreens.collection.detailModal;
const CARD_BORDER = 9;
const ULTRA_RARE_TIER_COLOR = resolveTierColor(Tier.ULTRA_RARE);

export type ZoneUnlockModalProps = {
  visible: boolean;
  zone: SleepZoneView | null;
  candies: number;
  unlocking?: boolean;
  zoneUnlockTutorialMessage?: TutorialDialogueMessage;
  onZoneUnlockTutorialDismiss?: () => void;
  onClose: () => void;
  onUnlock: () => void;
};

function LockedRequirementMessage({
  needed,
}: {
  needed: number;
}) {
  const slimeWord = needed === 1 ? 'slime' : 'slimes';
  const tierLabel = TIER_LABELS[Tier.ULTRA_RARE];
  return (
    <Text style={styles.lockedMessage}>
      Discover {needed} more <Text style={styles.lockedMessageTier}>{tierLabel}</Text> {slimeWord}{' '}
      to unlock.
    </Text>
  );
}

export function ZoneUnlockModal({
  visible,
  zone,
  candies,
  unlocking = false,
  zoneUnlockTutorialMessage,
  onZoneUnlockTutorialDismiss,
  onClose,
  onUnlock,
}: ZoneUnlockModalProps) {
  if (!zone) return null;

  const showZoneUnlockTutorial =
    visible && !!zoneUnlockTutorialMessage && !!onZoneUnlockTutorialDismiss;

  const candyCost = zone.nextUnlockCandyCost;
  const meetsUltraRareGate = zone.ultraRaresNeeded === 0;
  const meetsCandies = candyCost != null && candies >= candyCost;
  const lockedByUltraRare = !zone.unlocked && candyCost != null && !meetsUltraRareGate;
  const showLockedOverlay = lockedByUltraRare;
  const canUnlock = zone.canUnlock && !unlocking;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={showZoneUnlockTutorial ? undefined : onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.overlay}
          onPress={showZoneUnlockTutorial ? undefined : onClose}
        >
          <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
            <View style={styles.card}>
              <View style={styles.cardInner}>
                <View style={styles.headerPanel}>
                  <FitText
                    text={zone.name}
                    preset="zoneUnlockModalTitle"
                    style={styles.title}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.55}
                  />
                  <Text style={styles.blurb}>{zone.blurb}</Text>
                </View>

                <View style={styles.body}>
                  {candyCost != null ? (
                    <>
                      <View style={styles.costPill}>
                        <Text style={styles.costText}>Cost: {candyCost}</Text>
                        <CandyGlyph size={22} />
                      </View>

                      {!meetsCandies && !showLockedOverlay ? (
                        <Text style={styles.candyHint}>
                          Need {candyCost - candies} more{' '}
                          {candyCost - candies === 1 ? 'candy' : 'candies'}.
                        </Text>
                      ) : null}

                      <Pressable
                        style={[styles.unlockBtn, (!canUnlock || showLockedOverlay) && styles.unlockBtnDisabled]}
                        onPress={canUnlock && !showLockedOverlay ? onUnlock : undefined}
                        disabled={!canUnlock || showLockedOverlay}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !canUnlock || showLockedOverlay }}
                      >
                        <Text style={styles.unlockBtnText}>{unlocking ? 'Unlocking…' : 'Unlock'}</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>

              {showLockedOverlay ? (
                <View style={styles.lockedOverlay}>
                  <View style={styles.lockedCenter}>
                    <Ionicons name="lock-closed" size={56} color={t.levelUpText} />
                    <Text style={styles.lockedLabel}>Locked</Text>
                    <View style={styles.lockedMessageWrap}>
                      <LockedRequirementMessage needed={zone.ultraRaresNeeded} />
                    </View>
                  </View>
                </View>
              ) : null}
            </View>

            {!showZoneUnlockTutorial ? (
              <Pressable
                style={styles.closeBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={t.levelUpText} />
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>

        {showZoneUnlockTutorial ? (
          <TutorialNpcDialoguePanel
            visible
            embedded
            message={zoneUnlockTutorialMessage}
            onDismiss={onZoneUnlockTutorialDismiss}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = createAppStyles({
  modalRoot: {
    flex: 1,
  },
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
    backgroundColor: t.surface,
    borderWidth: 6,
    borderColor: t.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  card: {
    width: '100%',
    backgroundColor: t.bg,
    borderRadius: 14,
    borderWidth: CARD_BORDER,
    borderColor: t.border,
    overflow: 'visible',
    position: 'relative',
    marginTop: 14,
  },
  cardInner: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerPanel: {
    backgroundColor: t.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
    marginTop: 6,
  },
  title: {
    fontFamily: APP_FONT_FAMILY,
    fontWeight: '800',
    color: t.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  blurb: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 15,
    fontWeight: '600',
    color: t.accent,
    textAlign: 'center',
    lineHeight: 21,
  },
  body: {
    gap: 8,
  },
  costPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: t.accent,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  costText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: t.levelUpText,
  },
  candyHint: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: t.accent,
    textAlign: 'center',
  },
  unlockBtn: {
    alignSelf: 'center',
    minWidth: 160,
    paddingVertical: 6,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 6,
    borderColor: t.accent,
    backgroundColor: t.surface,
    alignItems: 'center',
  },
  unlockBtnDisabled: {
    opacity: 0.45,
  },
  unlockBtnText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 34,
    fontWeight: '800',
    color: t.accent,
  },
  lockedOverlay: {
    position: 'absolute',
    top: -CARD_BORDER,
    left: -CARD_BORDER,
    right: -CARD_BORDER,
    bottom: -CARD_BORDER,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 44, 44, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    zIndex: 2,
  },
  lockedCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    maxWidth: '100%',
  },
  lockedLabel: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    color: t.levelUpText,
    marginBottom: 0
  },
  lockedMessageWrap: {
    width: '100%',
    marginTop: 4,
  },
  lockedMessage: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: t.levelUpText,
    textAlign: 'center',
    lineHeight: 22,
  },
  lockedMessageTier: {
    fontWeight: '800',
    color: ULTRA_RARE_TIER_COLOR,
  },
});
