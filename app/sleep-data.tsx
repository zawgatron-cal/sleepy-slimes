/**
 * Sleep Data — weekly chart, stats, log.
 */

import { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { OutlinedSvgLabel } from '@/src/components/OutlinedSvgLabel';
import { SLEEP_TRACKING_LOGO } from '@/src/constants/sleepTrackingAssets';
import {
  SLEEP_DATA_INFO_COPY,
  SLEEP_DATA_INFO_PILL,
  SLEEP_DATA_LOG_ENTRY_BORDER_RADIUS,
} from '@/src/constants/sleepDataScreen';
import { useSleepDataScreen } from '@/src/hooks/useSleepDataScreen';
import { useTutorialOnboardingLocked } from '@/src/stores';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import type { SleepSession } from '@/src/types';
import { getSessionSleepQuality } from '@/src/utils/sleepQuality';
import {
  formatSleepLogDate,
  formatSleepLogDuration,
  formatSleepLogTimeRange,
} from '@/src/utils/sleepDataLogFormat';
import {
  getSleepDataChartMaxHours,
  type SleepDataWeekDay,
} from '@/src/utils/sleepDataWeekChart';

const t = mainScreens.sleepData;
const manualModalSurface = mainScreens.sleep.bedtimeModal.surface;

export default function SleepDataScreen() {
  const router = useRouter();
  const screen = useSleepDataScreen();
  const manualEntryLocked = useTutorialOnboardingLocked();

  const handleSelectManualField = (field: 'start' | 'end') => {
    screen.setActiveManualField(field);
    if (Platform.OS === 'android') screen.setShowManualPicker(true);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.titleWrap}>
          <View style={styles.titlePill} accessibilityRole="header">
            <OutlinedSvgLabel
              text="Sleep Data"
              fontSize={34}
              height={48}
              baselineY={38}
              strokeWidth={1.8}
              strokeColor={mainScreens.idle.specialTextBorder}
              fillColor={mainScreens.idle.specialTextFill}
              textAnchor="middle"
              style={styles.titleLabel}
              defaultWidth={200}
            />
          </View>
        </View>

        <SectionTitle>This Week</SectionTitle>
        <WeekChart weekDays={screen.weekDays} monthLabel={screen.monthLabel} />

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statsCell}>
              <StatCard label="Average Sleep Duration" value={screen.avgDurationDisplay} />
            </View>
            <View style={styles.statsCell}>
              <Pressable
                style={[styles.manualButton, manualEntryLocked && styles.manualButtonDisabled]}
                onPress={screen.openManualEntry}
                disabled={manualEntryLocked}
                accessibilityRole="button"
                accessibilityLabel="Add manual data"
                accessibilityState={{ disabled: manualEntryLocked }}
              >
                <Text style={styles.manualButtonText} numberOfLines={1}>
                  Add manual data
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsCell}>
              <StatCard
                label="Sleep Consistency"
                value={screen.consistencyDisplay}
                onPressInfo={() => screen.setConsistencyInfoVisible(true)}
              />
            </View>
            <View style={styles.statsCell}>
              <StatCard
                label="Avg Sleep Quality"
                value={screen.avgQualityDisplay}
                onPressInfo={() => screen.setQualityInfoVisible(true)}
              />
            </View>
          </View>
        </View>

        <SectionTitle>Other Data</SectionTitle>
        <View style={styles.otherDataRow}>
          <View style={styles.statsCell}>
            <DataPanel label="Total slimes spawned" value={String(screen.slimeCount)} icon="slime" />
          </View>
          <View style={styles.statsCell}>
            <DataPanel
              label="Total candies collected"
              value={String(screen.candyTotal)}
              icon="candy"
            />
          </View>
        </View>

        <SectionTitle>Sleep Log</SectionTitle>
        <View style={styles.logPanel}>
          {screen.logSessions.length === 0 ? (
            <Text style={styles.logEmpty}>No sleep entries yet</Text>
          ) : (
            screen.logSessions.map((session) => (
              <LogRow key={session.id} session={session} />
            ))
          )}
        </View>

        <InfoModal
          visible={screen.qualityInfoVisible}
          title={SLEEP_DATA_INFO_COPY.quality.title}
          body={SLEEP_DATA_INFO_COPY.quality.body}
          onClose={() => screen.setQualityInfoVisible(false)}
        />
        <InfoModal
          visible={screen.consistencyInfoVisible}
          title={SLEEP_DATA_INFO_COPY.consistency.title}
          body={SLEEP_DATA_INFO_COPY.consistency.body}
          onClose={() => screen.setConsistencyInfoVisible(false)}
        />
        <ManualEntryModal
          visible={screen.manualEntryVisible}
          manualStart={screen.manualStart}
          manualEnd={screen.manualEnd}
          activeField={screen.activeManualField}
          showPicker={screen.showManualPicker}
          onChangeStart={screen.setManualStart}
          onChangeEnd={screen.setManualEnd}
          onSelectField={handleSelectManualField}
          onDismissPicker={() => screen.setShowManualPicker(false)}
          onClose={screen.closeManualEntry}
          onSave={screen.saveManualEntry}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function StatCard({
  label,
  value,
  onPressInfo,
}: {
  label: string;
  value: string;
  onPressInfo?: () => void;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statLabelRow}>
        <Text
          style={styles.statLabel}
          numberOfLines={2}
          ellipsizeMode="tail"
          allowFontScaling={false}
        >
          {label}
        </Text>
        {onPressInfo ? (
          <Pressable
            onPress={onPressInfo}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`${label} info`}
          >
            <Text style={styles.statInfoMark}>?</Text>
          </Pressable>
        ) : null}
      </View>
      <Text
        style={styles.statValue}
        numberOfLines={1}
        ellipsizeMode="tail"
        allowFontScaling={false}
      >
        {value}
      </Text>
    </View>
  );
}

function DataPanel({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: 'slime' | 'candy';
}) {
  return (
    <View style={styles.statCard}>
      <Text
        style={styles.statLabel}
        numberOfLines={2}
        ellipsizeMode="tail"
        allowFontScaling={false}
      >
        {label}
      </Text>
      <View style={styles.otherDataValueRow}>
        <Text
          style={styles.otherDataValue}
          numberOfLines={1}
          ellipsizeMode="tail"
          allowFontScaling={false}
        >
          {value}
        </Text>
        {icon === 'slime' ? (
          <Image source={SLEEP_TRACKING_LOGO} style={styles.slimeIcon} resizeMode="contain" />
        ) : (
          <View style={styles.candyIconWrap}>
            <CandyGlyph size={28} />
          </View>
        )}
      </View>
    </View>
  );
}

function WeekChart({
  weekDays,
  monthLabel,
}: {
  weekDays: SleepDataWeekDay[];
  monthLabel: string;
}) {
  const chartMaxHours = getSleepDataChartMaxHours(weekDays);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartInner}>
        <View style={styles.chartGutter}>
          <View style={styles.chartPlotGutter}>
            <Text style={styles.chartAxisText}>{chartMaxHours} hr</Text>
            <View style={styles.chartGutterSpacer} />
            <Text style={styles.chartAxisText}>0 hr</Text>
          </View>
          <View style={styles.chartMonthSlot}>
            <Text style={styles.chartMonthLabel} numberOfLines={1}>
              {monthLabel}
            </Text>
          </View>
        </View>
        <View style={styles.chartPlot}>
          <View style={styles.chartBarsRow}>
            {weekDays.map((day) => {
              const ratio = day.hours / chartMaxHours;
              const heightPct = day.hours > 0 ? Math.max(8, Math.round(ratio * 100)) : 0;
              return (
                <View key={`${day.weekday}-${day.dayNum}`} style={styles.barColumn}>
                  <View style={styles.barSlot}>
                    {heightPct > 0 ? (
                      <View style={[styles.bar, { height: `${heightPct}%` }]} />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.chartDayLabels}>
            {weekDays.map((day) => (
              <View key={`${day.weekday}-${day.dayNum}-label`} style={styles.chartDayLabelSlot}>
                <Text style={styles.chartDayLabel}>{day.weekday}</Text>
                <Text style={styles.chartDayNum}>{day.dayNum}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function LogRow({ session }: { session: SleepSession }) {
  return (
    <View style={styles.logRow}>
      <View style={styles.logLeft}>
        <Text style={styles.logDate}>{formatSleepLogDate(session.startedAt)}</Text>
        <Text style={styles.logSub}>{formatSleepLogTimeRange(session)}</Text>
      </View>
      <View style={styles.logRight}>
        <Text style={styles.logDuration}>{formatSleepLogDuration(session.durationHours)}</Text>
        <Text style={styles.logSub}>
          Sleep Quality: {getSessionSleepQuality(session).toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

/* DEV: swipe-to-delete log rows — re-enable when delete should adjust stats/rewards.
function SwipeToDeleteRow({ ... }) { ... }
*/

function InfoModal({
  visible,
  title,
  body,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalBody}>{body}</Text>
          <Pressable style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ManualEntryModal({
  visible,
  manualStart,
  manualEnd,
  activeField,
  showPicker,
  onChangeStart,
  onChangeEnd,
  onSelectField,
  onDismissPicker,
  onClose,
  onSave,
}: {
  visible: boolean;
  manualStart: Date;
  manualEnd: Date;
  activeField: 'start' | 'end';
  showPicker: boolean;
  onChangeStart: (date: Date) => void;
  onChangeEnd: (date: Date) => void;
  onSelectField: (field: 'start' | 'end') => void;
  onDismissPicker: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const activeTime = activeField === 'start' ? manualStart : manualEnd;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Manual entry</Text>
          <Text style={styles.modalBody}>
            Pick a start and end time. If the end time is earlier than the start time, it will be
            treated as the next day.
          </Text>

          <ManualTimeChip
            label="Start"
            time={manualStart}
            active={activeField === 'start'}
            onPress={() => onSelectField('start')}
          />
          <ManualTimeChip
            label="End"
            time={manualEnd}
            active={activeField === 'end'}
            onPress={() => onSelectField('end')}
          />

          {(Platform.OS === 'ios' || showPicker) && (
            <>
              <Text style={styles.manualEditingLabel}>
                Editing: {activeField === 'start' ? 'Start time' : 'End time'}
              </Text>
              <View style={styles.manualPickerWrap}>
                <DateTimePicker
                  value={activeTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event: { type?: string }, date?: Date) => {
                    if (Platform.OS === 'android' && event.type === 'dismissed') {
                      onDismissPicker();
                      return;
                    }
                    if (date) {
                      if (activeField === 'start') onChangeStart(date);
                      else onChangeEnd(date);
                    }
                    if (Platform.OS === 'android') onDismissPicker();
                  }}
                  themeVariant="light"
                  textColor={Platform.OS === 'ios' ? t.logText : undefined}
                  accentColor={Platform.OS === 'ios' ? t.logText : undefined}
                  style={Platform.OS === 'ios' ? styles.manualPicker : undefined}
                />
              </View>
            </>
          )}

          <View style={styles.modalButtonsRow}>
            <Pressable style={styles.modalSecondaryButton} onPress={onClose}>
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.modalButton, styles.modalPrimaryWide]} onPress={onSave}>
              <Text style={styles.modalButtonText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ManualTimeChip({
  label,
  time,
  active,
  onPress,
}: {
  label: string;
  time: Date;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.manualRow}>
      <Text style={styles.manualLabel}>{label}</Text>
      <Pressable style={[styles.manualChip, active && styles.manualChipActive]} onPress={onPress}>
        <Text style={[styles.manualChipText, active && styles.manualChipTextActive]}>
          {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = createAppStyles({
  screen: { flex: 1, backgroundColor: t.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: '700', color: t.sectionTitle },
  titleWrap: { alignItems: 'center', marginBottom: 20, overflow: 'visible' },
  titlePill: {
    minHeight: 88,
    minWidth: 240,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: mainScreens.idle.surface,
    borderWidth: 10,
    borderColor: mainScreens.idle.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  titleLabel: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: t.sectionTitle,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginBottom: 10,
    marginTop: 4,
  },

  chartCard: {
    backgroundColor: t.chartBg,
    borderRadius: 16,
    borderWidth: 8,
    borderColor: t.chartBorder,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 16,
    minHeight: 168,
  },
  chartInner: { flexDirection: 'row', alignItems: 'flex-start' },
  chartGutter: { width: 36, paddingRight: 6 },
  chartPlotGutter: {
    height: 110,
    justifyContent: 'space-between',
  },
  chartGutterSpacer: { flex: 1 },
  chartAxisText: { color: t.chartLabel, fontSize: 11, fontWeight: '700' },
  chartMonthSlot: {
    height: 16,
    marginTop: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartMonthLabel: {
    color: t.chartLabel,
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '800',
    textAlign: 'left',
  },
  chartPlot: { flex: 1 },
  chartBarsRow: {
    height: 110,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 2,
  },
  barColumn: { flex: 1, height: '100%' },
  barSlot: { flex: 1, justifyContent: 'flex-end' },
  bar: {
    width: '100%',
    backgroundColor: t.chartBar,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  chartDayLabels: {
    flexDirection: 'row',
    marginTop: 6,
    paddingHorizontal: 2,
    gap: 6,
  },
  chartDayLabelSlot: { flex: 1, alignItems: 'center' },
  chartDayLabel: { color: t.chartLabel, fontSize: 11, fontWeight: '700' },
  chartDayNum: { color: t.chartLabel, fontSize: 11, fontWeight: '700', marginTop: 1 },

  statsGrid: { gap: 10, marginBottom: 16, alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  statsCell: { width: SLEEP_DATA_INFO_PILL.width },

  statCard: {
    width: SLEEP_DATA_INFO_PILL.width,
    minHeight: SLEEP_DATA_INFO_PILL.minHeight,
    backgroundColor: t.statCard,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  statLabelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  statLabel: {
    flexShrink: 1,
    fontSize: SLEEP_DATA_INFO_PILL.labelFontSize,
    fontWeight: '700',
    color: t.statLabel,
    lineHeight: SLEEP_DATA_INFO_PILL.labelLineHeight,
  },
  statInfoMark: {
    fontSize: 15,
    fontWeight: '800',
    color: t.infoIcon,
    marginTop: 0,
  },
  statValue: {
    fontSize: SLEEP_DATA_INFO_PILL.valueFontSize,
    fontWeight: '800',
    color: t.statValue,
    lineHeight: SLEEP_DATA_INFO_PILL.valueLineHeight,
  },

  manualButton: {
    width: SLEEP_DATA_INFO_PILL.width,
    minHeight: SLEEP_DATA_INFO_PILL.minHeight,
    backgroundColor: t.actionButtonBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButtonDisabled: {
    opacity: 0.45,
  },
  manualButtonText: {
    color: t.actionButtonText,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },

  otherDataRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'center',
  },
  otherDataValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otherDataValue: {
    fontSize: SLEEP_DATA_INFO_PILL.valueFontSize,
    fontWeight: '800',
    color: t.statValue,
    flex: 1,
    lineHeight: SLEEP_DATA_INFO_PILL.valueLineHeight,
  },
  slimeIcon: { width: 28, height: 28 },
  candyIconWrap: { marginRight: -2 },

  logPanel: {
    backgroundColor: t.logPanel,
    borderRadius: 16,
    padding: 10,
    gap: 8,
    minHeight: 80,
  },
  logEmpty: {
    textAlign: 'center',
    color: t.logMuted,
    fontWeight: '600',
    paddingVertical: 20,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: t.logRow,
    borderRadius: SLEEP_DATA_LOG_ENTRY_BORDER_RADIUS,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  logLeft: { flex: 1 },
  logRight: { alignItems: 'flex-end', maxWidth: '52%' },
  logDate: { fontSize: 15, fontWeight: '800', color: t.logText },
  logDuration: { fontSize: 15, fontWeight: '800', color: t.logText },
  logSub: { marginTop: 4, fontSize: 12, fontWeight: '600', color: t.logMuted },

  /* DEV: swipeWrap, deleteBg, deleteX — used by SwipeToDeleteRow */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(60, 40, 40, 0.35)',
    padding: 16,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: manualModalSurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: mainScreens.sleep.bedtimeModal.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: t.logText, marginBottom: 8 },
  modalBody: { color: t.logMuted, fontWeight: '600', lineHeight: 20 },
  modalButton: {
    marginTop: 14,
    backgroundColor: t.actionButtonBg,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalButtonText: { color: t.actionButtonText, fontWeight: '800' },
  modalButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' },
  modalSecondaryButton: {
    flex: 1,
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: t.logRowBorder,
  },
  modalSecondaryButtonText: { color: t.logText, fontWeight: '800' },
  modalPrimaryWide: { flex: 1.6 },

  manualRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  manualLabel: { fontWeight: '800', color: t.logText },
  manualChip: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: t.logRowBorder,
  },
  manualChipActive: { backgroundColor: t.actionButtonBg, borderColor: t.actionButtonBg },
  manualChipText: { fontWeight: '800', color: t.logText },
  manualChipTextActive: { color: t.actionButtonText },
  manualEditingLabel: { marginTop: 10, marginBottom: 4, fontWeight: '700', color: t.logMuted },
  manualPickerWrap: {
    marginTop: 4,
    backgroundColor: manualModalSurface,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  manualPicker: { backgroundColor: manualModalSurface },
});
