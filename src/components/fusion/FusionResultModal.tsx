/**
 * Fusion screen — result after a successful fuse.
 */

import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { TIER_LABELS, type SlimeVariant } from '@/src/constants/game';
import { SlimeArtwork } from '@/src/components/SlimeArtwork';
import type { Species } from '@/src/types';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { resolveTierColor, resolveTierGradientColor } from '@/src/theme/tierAccents';

export type FusionResultModalProps = {
  visible: boolean;
  onDismiss: () => void;
  resultSpecies: Species | null;
  resultVariant?: SlimeVariant;
};

export function FusionResultModal({
  visible,
  onDismiss,
  resultSpecies,
  resultVariant,
}: FusionResultModalProps) {
  const tierColor = resolveTierColor(resultSpecies?.tier);
  const iconGradientColor = resolveTierGradientColor(resultSpecies?.tier);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={styles.resultCard}>
          <Text style={styles.resultYouGot}>You Got:</Text>
          <View style={styles.resultIconFrame}>
            <View style={styles.resultIconBackground}>
              <Svg
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <Defs>
                  <LinearGradient id="fusion-result-icon-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={iconGradientColor} stopOpacity={0} />
                    <Stop offset="52%" stopColor={iconGradientColor} stopOpacity={0.1} />
                    <Stop offset="100%" stopColor={iconGradientColor} stopOpacity={0.72} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100" height="100" fill="url(#fusion-result-icon-bg)" />
              </Svg>
              <SlimeArtwork
                speciesId={resultSpecies?.id ?? ''}
                variant={resultVariant}
                style={styles.resultArtwork}
                imageStyle={styles.resultIconImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.resultName} numberOfLines={2}>
            {resultSpecies?.name ?? '—'}
          </Text>
          <Text style={[styles.resultTier, { color: tierColor }]}>
            {resultSpecies ? TIER_LABELS[resultSpecies.tier] : ''}
          </Text>
          <Pressable style={styles.resultFuseBtn} onPress={onDismiss}>
            <Text style={styles.resultFuseText}>Yay!</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = createAppStyles({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  resultCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#F1E2E4',
    borderRadius: 18,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  resultYouGot: {
    alignSelf: 'flex-start',
    fontSize: 32,
    lineHeight: 28,
    fontWeight: '800',
    color: '#EC8E91',
    marginBottom: -20,
  },
  resultIconFrame: {
    width: '100%',
    maxWidth: 248,
    aspectRatio: 1.3,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultIconBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultArtwork: { width: '88%', height: '88%' },
  resultIconImage: { width: '100%', height: '100%' },
  resultName: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '800',
    color: '#EC8E91',
    textAlign: 'center',
    marginBottom: -2,
  },
  resultTier: {
    fontSize: 22,
    lineHeight: 20,
    fontWeight: '800',
    marginBottom: 9,
  },
  resultFuseBtn: {
    width: '58%',
    minWidth: 170,
    backgroundColor: '#F2BFC4',
    borderColor: '#EC8E91',
    borderWidth: 6,
    borderRadius: 22,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resultFuseText: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
    color: '#EC8E91',
  },
});
