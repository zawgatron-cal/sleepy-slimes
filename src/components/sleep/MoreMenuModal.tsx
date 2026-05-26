/**
 * Sleep idle "More" options sheet — compact centered modal (collection-style scrim).
 */

import {
  Image,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MORE_SLIMEPEDIA_ICON } from '@/src/constants/sleepIdleAssets';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const t = mainScreens.idle;
const scrim = mainScreens.collection.detailModal.overlay;

const CARD_MAX_WIDTH = 300;
const CARD_PAD = 22;
const ICON_SIZE = 50;
const ROW_GAP = 12;

export type MoreMenuModalProps = {
  visible: boolean;
  showDev?: boolean;
  onClose: () => void;
  onSlimepedia: () => void;
  onRendererTest?: () => void;
  onDev?: () => void;
};

function HandDrawnDivider({ width }: { width: number }) {
  const w = Math.max(1, width);
  const mid = w * 0.5;
  const d = `M 0 7 Q ${w * 0.22} 3.5 ${mid} 8.5 T ${w} 6.5`;
  return (
    <Svg width={w} height={14} viewBox={`0 0 ${w} 14`}>
      <Path
        d={d}
        stroke={t.border}
        strokeWidth={4.5}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MoreMenuModal({
  visible,
  showDev = false,
  onClose,
  onSlimepedia,
  onRendererTest,
  onDev,
}: MoreMenuModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.min(CARD_MAX_WIDTH, windowWidth - 48);
  const dividerWidth = cardWidth - CARD_PAD * 2;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.card, { width: cardWidth }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>More</Text>

          <View style={styles.dividerWrap}>
            <HandDrawnDivider width={dividerWidth} />
          </View>

          <View style={styles.items}>
            <Pressable
              style={({ pressed }) => [styles.rowHit, pressed && styles.rowPressed]}
              onPress={onSlimepedia}
              accessibilityRole="button"
              accessibilityLabel="Slimepedia"
            >
              <View style={styles.rowGroup}>
                <Image
                  source={MORE_SLIMEPEDIA_ICON}
                  style={styles.rowIcon}
                  resizeMode="contain"
                />
                <Text style={styles.rowLabel}>Slimepedia</Text>
              </View>
            </Pressable>

            {onRendererTest != null ? (
              <Pressable
                style={({ pressed }) => [styles.rowHit, pressed && styles.rowPressed]}
                onPress={onRendererTest}
                accessibilityRole="button"
                accessibilityLabel="Renderer Test"
              >
                <Text style={styles.rowLabel}>Renderer Test</Text>
              </Pressable>
            ) : null}

            {showDev && onDev != null ? (
              <Pressable
                style={({ pressed }) => [styles.rowHit, pressed && styles.rowPressed]}
                onPress={onDev}
                accessibilityRole="button"
                accessibilityLabel="Dev"
              >
                <Text style={styles.rowLabel}>Dev</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.rowPressed]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = createAppStyles({
  overlay: {
    flex: 1,
    backgroundColor: scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: t.bg,
    borderRadius: 14,
    paddingHorizontal: CARD_PAD,
    paddingTop: 20,
    paddingBottom: 10,
    maxWidth: CARD_MAX_WIDTH,
  },
  title: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 34,
    lineHeight: 38,
    color: t.border,
    textAlign: 'center',
    marginBottom: 14,
  },
  dividerWrap: {
    marginBottom: 18,
    alignItems: 'center',
  },
  items: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  rowHit: {
    alignSelf: 'center',
  },
  rowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ROW_GAP,
  },
  rowIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  rowPressed: {
    opacity: 0.65,
  },
  rowLabel: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 35,
    lineHeight: 34,
    color: t.border,
  },
  cancelBtn: {
    alignSelf: 'center',
    paddingVertical: 0,
    paddingHorizontal: 16,
  },
  cancelLabel: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 34,
    lineHeight: 34,
    color: t.border,
    textAlign: 'center',
  },
});
