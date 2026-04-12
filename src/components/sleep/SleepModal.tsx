/**
 * Pre-sleep modal — left-aligned Bedtime + Alarm, SVG title stroke,
 * full-width centered Start sleeping, small Cancel underneath.
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  Dimensions,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  formatTime,
  computeNextAlarmDateFromTime,
  getDefaultAlarmDate,
} from '@/src/utils/sleepScreen';
import { uiOne } from '@/src/theme/uiOne';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const m = uiOne.bedtimeModal;

/**
 * iOS time spinner is a native UIDatePicker — parent `maxWidth` / `%` does not shrink it.
 * Fixed `width`/`height` on the picker plus `transform: scale` is what actually reduces size.
 */
const IOS_TIME_PICKER_WIDTH = 220;
const IOS_TIME_PICKER_HEIGHT = 160;
const IOS_TIME_PICKER_SCALE = 0.76;
/** Transforms do not shrink layout in RN; pull vertical space back so the modal stays tight. */
const IOS_TIME_PICKER_MARGIN_COMPRESS = -36;

const TITLE = 'All ready for bed?';
const TITLE_FONT_SIZE = 38;
const TITLE_SVG_HEIGHT = 40;
const TITLE_STROKE_WIDTH = 1.5;

/** Left edge for body lines (Bedtime, Alarm label) */
const BODY_PAD = 0;

function BedTitleSvg() {
  const winW = Dimensions.get('window').width;
  const defaultW = Math.min(560, Math.max(200, winW - 48));
  const [w, setW] = useState(defaultW);
  const cx = w / 2;
  const baselineY = 32;

  return (
    <View
      style={titleStyles.svgWrap}
      onLayout={(e) => {
        const nw = Math.floor(e.nativeEvent.layout.width);
        if (nw > 0 && nw !== w) setW(nw);
      }}
    >
      <Svg width={w} height={TITLE_SVG_HEIGHT}>
        <SvgText
          x={cx}
          y={baselineY}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={TITLE_FONT_SIZE}
          fontWeight="900"
          stroke={m.onAccentStroke}
          strokeWidth={TITLE_STROKE_WIDTH}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {TITLE}
        </SvgText>
        <SvgText
          x={cx}
          y={baselineY}
          textAnchor="middle"
          fontFamily={APP_FONT_FAMILY}
          fontSize={TITLE_FONT_SIZE}
          fontWeight="900"
          fill={m.textSalmon}
        >
          {TITLE}
        </SvgText>
      </Svg>
    </View>
  );
}

const titleStyles: { svgWrap: ViewStyle } = {
  svgWrap: {
    alignSelf: 'stretch',
    marginBottom: 6,
    alignItems: 'center',
  },
};

export type SleepModalProps = {
  visible: boolean;
  alarmDate: Date | null;
  onAlarmDateChange: (date: Date | null) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function SleepModal({
  visible,
  alarmDate,
  onAlarmDateChange,
  onClose,
  onConfirm,
}: SleepModalProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  /** Nearly full width; landscape-friendly (card wider than it is tall). */
  const modalMaxWidth = Math.min(windowWidth - 24, 640);

  const handleChange = (event: { type?: string }, date?: Date) => {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (date) {
      const next = computeNextAlarmDateFromTime(date);
      onAlarmDateChange(next);
    }
    if (Platform.OS === 'android') setShowPicker(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, { maxWidth: modalMaxWidth }]}
          onPress={(e) => e.stopPropagation()}
        >
          <BedTitleSvg />
          <View style={styles.titleDivider} />

          <Text style={styles.bedtime}>
            Bedtime: {formatTime(Date.now())}
          </Text>

          <View style={styles.alarmBlock}>
            <Text style={styles.alarmLabel}>Alarm</Text>
            <View style={styles.alarmActions}>
              <Pressable
                style={[styles.alarmPill, !alarmDate && styles.alarmPillActive]}
                onPress={() => {
                  onAlarmDateChange(null);
                  setShowPicker(false);
                }}
              >
                <Text style={[styles.alarmPillText, !alarmDate && styles.alarmPillTextActive]}>
                  No alarm
                </Text>
              </Pressable>
              <Pressable
                style={[styles.alarmPill, alarmDate && styles.alarmPillActive]}
                onPress={() => {
                  if (!alarmDate) onAlarmDateChange(getDefaultAlarmDate());
                  setShowPicker(true);
                }}
              >
                <Text style={[styles.alarmPillText, alarmDate && styles.alarmPillTextActive]}>
                  {alarmDate ? formatTime(alarmDate.getTime()) : 'Set'}
                </Text>
              </Pressable>
            </View>
          </View>

          {showPicker && (
            <View style={styles.pickerWrap}>
              {Platform.OS === 'ios' ? (
                <View style={styles.pickerIosShrink}>
                  <DateTimePicker
                    value={alarmDate ?? new Date()}
                    mode="time"
                    display="spinner"
                    onChange={handleChange}
                    themeVariant="light"
                    textColor={m.textSalmon}
                    accentColor={m.accent}
                    style={{
                      backgroundColor: m.pillInactiveBg,
                      width: IOS_TIME_PICKER_WIDTH,
                      height: IOS_TIME_PICKER_HEIGHT,
                    }}
                  />
                </View>
              ) : (
                <DateTimePicker
                  value={alarmDate ?? new Date()}
                  mode="time"
                  display="default"
                  onChange={handleChange}
                  themeVariant="light"
                />
              )}
            </View>
          )}

          <View style={styles.actionsColumn}>
            <Pressable
              style={({ pressed }) => [styles.primaryCta, pressed && styles.primaryCtaPressed]}
              onPress={onConfirm}
            >
              <Text style={styles.primaryCtaText}>Start sleeping</Text>
            </Pressable>
            <Pressable style={styles.cancelLink} onPress={onClose}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const primaryPillRadius = 999;
/** Compact alarm chips (reference: small side-by-side capsules, not full-width) */
const alarmPillRadius = 14;
const alarmPillStroke = 2.5;
/** Visible outline on primary CTA */
const btnStroke = 6;
const btnStrokeOnAccent = m.onAccentStroke;
const btnStrokeOutline = m.outlineStroke;

const styles = createAppStyles({
  modalOverlay: {
    flex: 1,
    backgroundColor: m.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: m.bg,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 12,
    borderWidth: 6,
    borderColor: m.border,
  },
  titleDivider: {
    alignSelf: 'stretch',
    height: 5,
    borderRadius: 999,
    backgroundColor: m.divider,
    opacity: 0.85,
    marginBottom: 8,
  },
  bedtime: {
    fontSize: 20,
    fontWeight: '700',
    color: m.textSalmon,
    marginBottom: 2,
    textAlign: 'left',
    paddingLeft: BODY_PAD,
  },
  alarmBlock: {
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  alarmLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: m.textSalmon,
    marginBottom: 4,
    textAlign: 'left',
    paddingLeft: BODY_PAD,
  },
  alarmActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignSelf: 'flex-start',
  },
  alarmPill: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: alarmPillRadius,
    backgroundColor: m.pillInactiveBg,
    borderWidth: alarmPillStroke,
    borderColor: btnStrokeOutline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmPillActive: {
    backgroundColor: m.accentPressed,
    borderWidth: alarmPillStroke,
    borderColor: btnStrokeOnAccent,
  },
  alarmPillText: {
    fontSize: 16,
    fontWeight: '700',
    color: m.textSalmon,
    letterSpacing: 0.2,
  },
  alarmPillTextActive: {
    color: m.textOnAccent,
  },
  pickerWrap: {
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 0,
  },
  pickerIosShrink: {
    alignSelf: 'center',
    transform: [{ scale: IOS_TIME_PICKER_SCALE }],
    marginVertical: IOS_TIME_PICKER_MARGIN_COMPRESS,
  },
  actionsColumn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryCta: {
    alignSelf: 'stretch',
    backgroundColor: m.accentPressed,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: primaryPillRadius,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderWidth: btnStroke,
    borderColor: btnStrokeOnAccent,
  },
  primaryCtaPressed: {
    backgroundColor: m.accent,
    borderColor: btnStrokeOnAccent,
  },
  primaryCtaText: {
    color: m.textOnAccent,
    fontSize: 22,
    fontWeight: '800',
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  cancelLinkText: {
    fontSize: 22,
    fontWeight: '600',
    color: m.textSalmon,
  },
});
