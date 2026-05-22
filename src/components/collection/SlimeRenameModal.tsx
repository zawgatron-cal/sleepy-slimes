/**
 * Rename one slime instance (nickname only; species unchanged).
 */

import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal } from 'react-native';
import { MAX_SLIME_NICKNAME_LENGTH } from '@/src/utils/slimeDisplayName';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const t = mainScreens.collection.detailModal;

export type SlimeRenameModalProps = {
  visible: boolean;
  initialValue: string;
  defaultName: string;
  onClose: () => void;
  onSave: (name: string) => void;
  onReset: () => void;
};

export function SlimeRenameModal({
  visible,
  initialValue,
  defaultName,
  onClose,
  onSave,
  onReset,
}: SlimeRenameModalProps) {
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    if (visible) setDraft(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Rename slime</Text>
          <Text style={styles.hint}>Default: {defaultName}</Text>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={defaultName}
            placeholderTextColor={`${t.accent}88`}
            maxLength={MAX_SLIME_NICKNAME_LENGTH}
            autoCapitalize="words"
            autoCorrect={false}
            selectTextOnFocus
            cursorColor={t.accent}
            selectionColor={`${t.accent}73`}
          />
          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={onReset}>
              <Text style={styles.secondaryBtnText}>Reset name</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => onSave(draft)}>
              <Text style={styles.primaryBtnText}>Save</Text>
            </Pressable>
          </View>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
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
    borderRadius: 16,
    borderWidth: 4,
    borderColor: t.border,
    padding: 18,
  },
  title: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    color: t.accent,
    marginBottom: 6,
  },
  hint: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    color: t.accent,
    marginBottom: 10,
  },
  input: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: t.accent,
    backgroundColor: t.progressTrack,
    borderWidth: 2,
    borderColor: t.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: t.accent,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: t.accent,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: t.accent,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: t.levelUpText,
  },
  cancelBtn: { alignItems: 'center', paddingVertical: 6 },
  cancelText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: t.accent,
  },
});
