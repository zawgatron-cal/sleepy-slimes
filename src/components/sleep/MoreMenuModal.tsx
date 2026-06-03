/**
 * Sleep idle "More" options sheet — compact centered modal (collection-style scrim).
 */

import type { ReactNode } from 'react';
import {
  Image,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
/** Shared row width so icon columns line up (Slimepedia is the widest label). */
const ROW_TRACK_WIDTH = ICON_SIZE + ROW_GAP + 200;
const GEAR_ICON_SIZE = 40;

export type MoreMenuModalProps = {
  visible: boolean;
  showDev?: boolean;
  onClose: () => void;
  onSlimepedia: () => void;
  onSettings: () => void;
  onDev?: () => void;
};

function MoreMenuRow({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon: ReactNode | null;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.rowHit, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.rowGroup}>
        <View style={styles.rowIconSlot}>{icon}</View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
    </Pressable>
  );
}

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
  onSettings,
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
            <MoreMenuRow
              label="Slimepedia"
              onPress={onSlimepedia}
              icon={
                <Image
                  source={MORE_SLIMEPEDIA_ICON}
                  style={styles.rowIcon}
                  resizeMode="contain"
                />
              }
            />
            <MoreMenuRow
              label="Settings"
              onPress={onSettings}
              icon={
                <Ionicons name="settings-sharp" size={GEAR_ICON_SIZE} color={t.border} />
              }
            />
            {showDev && onDev != null ? (
              <MoreMenuRow label="Dev" onPress={onDev} icon={null} />
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
    width: ROW_TRACK_WIDTH,
  },
  rowIconSlot: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
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
