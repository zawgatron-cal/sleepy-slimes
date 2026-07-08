/**
 * Tutorial NPC + dialogue box (character art sits behind the card).
 */

import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SlimeArtwork } from '@/src/components/SlimeArtwork';
import { TUTORIAL_NPC_NAME } from '@/src/constants/tutorial';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const t = mainScreens.idle;

export type TutorialDialogueMessage = string | readonly string[];

function normalizePages(message: TutorialDialogueMessage): string[] {
  return typeof message === 'string' ? [message] : [...message];
}

export type TutorialNpcDialogueProps = {
  visible: boolean;
  message: TutorialDialogueMessage;
  npcName?: string;
  dismissLabel?: string;
  /** Optional result preview above the dialogue (fusion tutorial). */
  previewSpeciesId?: string;
  previewLabel?: string;
  confirmLabel?: string;
  onDismiss: () => void;
  onConfirm?: () => void;
  /** Render inside an existing modal instead of opening a new one. */
  embedded?: boolean;
};

export function TutorialNpcDialoguePanel({
  visible,
  message,
  npcName = TUTORIAL_NPC_NAME,
  dismissLabel = 'Got it',
  previewSpeciesId,
  previewLabel,
  confirmLabel,
  onDismiss,
  onConfirm,
  embedded = false,
}: TutorialNpcDialogueProps) {
  const showConfirm = !!onConfirm && !!confirmLabel;
  const pages = useMemo(() => normalizePages(message), [message]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (visible) setPageIndex(0);
  }, [visible, message]);

  if (!visible) return null;

  const currentMessage = pages[pageIndex] ?? '';
  const isLastPage = pageIndex >= pages.length - 1;

  const handleAdvance = () => {
    if (isLastPage) {
      onDismiss();
      return;
    }
    setPageIndex((index) => index + 1);
  };

  const overlayStyle = embedded ? styles.embeddedOverlay : styles.overlay;

  if (showConfirm) {
    return (
      <View style={overlayStyle} pointerEvents="box-none">
        <View style={styles.cardWrap}>
          <View style={styles.cardShadow} pointerEvents="none" />
          <View style={styles.card} accessibilityLabel={`${npcName} tutorial dialogue`}>
            <View style={styles.nameTag}>
              <Text style={styles.nameTagText}>{npcName}</Text>
            </View>

            {previewSpeciesId ? (
              <View style={styles.previewBlock}>
                <SlimeArtwork
                  speciesId={previewSpeciesId}
                  style={styles.previewArt}
                  imageStyle={styles.previewImage}
                  resizeMode="contain"
                  foilMotion="off"
                />
                {previewLabel ? <Text style={styles.previewLabel}>{previewLabel}</Text> : null}
              </View>
            ) : null}

            <Text style={styles.message}>{currentMessage}</Text>

            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.btnSecondary]}
                onPress={onDismiss}
                accessibilityRole="button"
              >
                <Text style={styles.btnSecondaryText}>Not yet</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnPrimary]}
                onPress={onConfirm}
                accessibilityRole="button"
              >
                <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={overlayStyle} pointerEvents="box-none">
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={handleAdvance}
        accessibilityRole="button"
        accessibilityLabel={isLastPage ? dismissLabel : 'Next'}
      />
      <View style={styles.cardWrap} pointerEvents="box-none">
        <View style={styles.cardShadow} pointerEvents="none" />
        <View style={styles.card} pointerEvents="none">
          <View style={styles.nameTag}>
            <Text style={styles.nameTagText}>{npcName}</Text>
          </View>

          <Text style={styles.message}>
            {currentMessage}
            <Text style={styles.messageArrow}> →</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

export function TutorialNpcDialogue({
  visible,
  embedded,
  onDismiss,
  ...rest
}: TutorialNpcDialogueProps) {
  const handleRequestClose = () => {
    onDismiss();
  };

  if (embedded) {
    return (
      <TutorialNpcDialoguePanel
        visible={visible}
        embedded
        onDismiss={onDismiss}
        {...rest}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose}>
      <TutorialNpcDialoguePanel visible={visible} onDismiss={onDismiss} {...rest} />
    </Modal>
  );
}

const styles = createAppStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 72,
  },
  embeddedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 72,
    zIndex: 100,
    elevation: 100,
  },
  cardWrap: {
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 7,
    left: 6,
    right: -7,
    bottom: -9,
    borderRadius: 24,
    backgroundColor: 'rgba(12, 10, 8, 0.72)',
  },
  card: {
    position: 'relative',
    backgroundColor: t.surface,
    borderRadius: 22,
    borderWidth: 5,
    borderColor: t.border,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 16,
  },
  nameTag: {
    position: 'absolute',
    top: -30,
    left: 6,
    zIndex: 2,
    backgroundColor: t.surface,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: t.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nameTagText: {
    fontSize: 22,
    fontWeight: '800',
    color: t.primaryText,
  },
  previewBlock: {
    alignItems: 'center',
    marginBottom: 10,
  },
  previewArt: {
    width: 120,
    height: 120,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewLabel: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: t.primaryText,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: t.primary,
  },
  messageArrow: {
    fontWeight: '800',
    color: t.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 4,
    minWidth: 96,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: t.tabSelectedFill,
    borderColor: t.tabSelectedShadow,
  },
  btnSecondary: {
    backgroundColor: t.bg,
    borderColor: t.border,
  },
  btnPrimaryText: {
    fontSize: 18,
    fontWeight: '800',
    color: t.specialTextFill,
  },
  btnSecondaryText: {
    fontSize: 18,
    fontWeight: '800',
    color: t.primaryText,
  },
});
