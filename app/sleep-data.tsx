import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Animated,
  PanResponder,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { deleteSleepSession, getSleepSessions, insertSleepSession } from '@/src/db';
import { ZONES } from '@/src/data';
import { refreshSleepStreakFromDb } from '@/src/services/refreshSleepStreakFromDb';
import { computeStreakSummaryFromSessions } from '@/src/services/sleepStreak';
import type { SleepSession } from '@/src/types';
import { formatDurationHours } from '@/src/utils/sleepScreen';

function Section({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function SectionWithInfo({
  title,
  onPressInfo,
  children,
}: {
  title: string;
  onPressInfo: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable
          onPress={onPressInfo}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`${title} info`}
        >
          <View style={styles.infoDot}>
            <Text style={styles.infoDotText}>?</Text>
          </View>
        </Pressable>
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function SleepDataScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [qualityInfoVisible, setQualityInfoVisible] = useState(false);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  const [manualStart, setManualStart] = useState(() => {
    const d = new Date();
    d.setHours(23, 0, 0, 0);
    return d;
  });
  const [manualEnd, setManualEnd] = useState(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    return d;
  });
  const [activeManualField, setActiveManualField] = useState<'start' | 'end'>('start');
  const [showManualPicker, setShowManualPicker] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await getSleepSessions();
      setSessions(rows);
      await refreshSleepStreakFromDb();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch((e) => console.warn('getSleepSessions failed', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streakSummary = useMemo(() => computeStreakSummaryFromSessions(sessions), [sessions]);

  const stats = useMemo(() => {
    if (sessions.length === 0) return null;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.durationHours || 0), 0);
    const totalQuality = sessions.reduce((sum, s) => sum + (s.quality || 0), 0);
    return {
      avgDurationHours: totalDuration / sessions.length,
      avgQuality: totalQuality / sessions.length,
      last7: sessions.slice(0, 7).reverse(), // oldest → newest
    };
  }, [sessions]);

  const handleDeleteSession = async (id: string) => {
    // Optimistic update
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteSleepSession(id);
    } catch (e) {
      console.warn('deleteSleepSession failed', e);
    } finally {
      await load().catch((e) => console.warn('getSleepSessions failed', e));
    }
  };

  const handleSaveManualEntry = async () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(manualStart.getHours(), manualStart.getMinutes(), 0, 0);
    const end = new Date(now);
    end.setHours(manualEnd.getHours(), manualEnd.getMinutes(), 0, 0);
    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1);
    }

    const startedAt = start.getTime();
    const endedAt = end.getTime();
    const durationMs = endedAt - startedAt;
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationMs < 30 * 1000) {
      Alert.alert('Too short', 'Sleep duration must be at least 30 seconds.');
      return;
    }

    const session: SleepSession = {
      id: `session_${Date.now()}`,
      zoneId: ZONES.GRASSY_MEADOW.id,
      startedAt,
      endedAt,
      durationHours,
      quality: 0.5,
      candiesEarned: 0,
    };

    try {
      await insertSleepSession(session);
      setManualEntryVisible(false);
      await load();
    } catch (e) {
      console.warn('insertSleepSession failed', e);
      Alert.alert('Error', 'Could not save sleep session.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>

          <Pressable
            onPress={() => load().catch((e) => console.warn('getSleepSessions failed', e))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Refresh"
          >
            <Text style={styles.refreshText}>{loading ? 'Loading…' : 'Refresh'}</Text>
          </Pressable>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          Sleep Data
        </Text>

        <View style={styles.streakRow}>
          <Text style={styles.streakText} accessibilityLabel="Current sleep streak">
            🔥 {streakSummary.currentStreak}
          </Text>
          {streakSummary.longestStreak > 0 ? (
            <Text style={styles.streakSub}>Best {streakSummary.longestStreak}</Text>
          ) : null}
        </View>

        <Section title="Graph">
          {stats ? (
            <View style={styles.graphWrap}>
              <View style={styles.graphRow}>
                {(() => {
                  const max = Math.max(...stats.last7.map((s) => s.durationHours || 0), 0.1);
                  const maxLabel = `${Math.round(max * 10) / 10}h`;
                  return (
                    <>
                      <View style={styles.yAxis}>
                        <Text style={styles.yAxisText}>{maxLabel}</Text>
                        <View style={styles.yAxisSpacer} />
                        <Text style={styles.yAxisText}>0h</Text>
                      </View>
                      <View style={styles.graphBars}>
                        {stats.last7.map((s) => {
                          const h = Math.max(0.08, (s.durationHours || 0) / max);
                          return (
                            <View key={s.id} style={styles.barSlot}>
                              <View style={[styles.bar, { height: `${Math.round(h * 100)}%` }]} />
                            </View>
                          );
                        })}
                      </View>
                    </>
                  );
                })()}
              </View>
              <Text style={styles.graphHint}>Last {Math.min(7, sessions.length)} sessions</Text>
            </View>
          ) : (
            <View style={[styles.placeholder, styles.graphPlaceholder]}>
              <Text style={styles.placeholderText}>No data yet</Text>
            </View>
          )}
        </Section>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.addButton}
            onPress={() => {
              setActiveManualField('start');
              setShowManualPicker(false);
              setManualEntryVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Add sleep session manually"
          >
            <Text style={styles.addButtonText}>Add manual data</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Section title="Avg. duration">
              {stats ? (
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatDurationHours(stats.avgDurationHours)}</Text>
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>—</Text>
                </View>
              )}
            </Section>
          </View>
          <View style={styles.half}>
            <SectionWithInfo
              title="Avg. quality"
              onPressInfo={() => setQualityInfoVisible(true)}
            >
              {stats ? (
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.avgQuality.toFixed(2)}</Text>
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>—</Text>
                </View>
              )}
            </SectionWithInfo>
          </View>
        </View>

        <Section title="Sleep log">
          {sessions.length === 0 ? (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No entries yet</Text>
            </View>
          ) : (
            <View style={styles.log}>
              {sessions.map((s) => {
                const start = new Date(s.startedAt);
                const end = s.endedAt ? new Date(s.endedAt) : null;
                const date = start.toLocaleDateString();
                const timeRange = end
                  ? `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}–${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                  : start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                return (
                  <SwipeToDeleteRow
                    key={s.id}
                    onDelete={() => handleDeleteSession(s.id)}
                    rightActionWidth={86}
                  >
                    <View style={styles.logRow}>
                      <View style={styles.logLeft}>
                        <Text style={styles.logDate} numberOfLines={1}>
                          {date}
                        </Text>
                        <Text style={styles.logSub} numberOfLines={1}>
                          {timeRange}
                        </Text>
                      </View>
                      <View style={styles.logRight}>
                        <Text style={styles.logMain} numberOfLines={1}>
                          {formatDurationHours(s.durationHours)}
                        </Text>
                        <Text style={styles.logSub} numberOfLines={1}>
                          Q {s.quality.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </SwipeToDeleteRow>
                );
              })}
            </View>
          )}
        </Section>

        <Modal
          visible={qualityInfoVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setQualityInfoVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setQualityInfoVisible(false)}
          >
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Sleep quality</Text>
              <Text style={styles.modalBody}>
                Sleep quality is a number from 0.00 to 1.00 stored with each sleep
                session. Right now it’s a simple app value (not measured from sensors).
                {'\n\n'}
                Slimes: currently, quality does not change which slimes you get (spawns
                are based on session length). In a later step, we can use quality to
                boost rewards (more candies, more slimes, or higher-tier odds).
              </Text>
              <Pressable
                style={styles.modalButton}
                onPress={() => setQualityInfoVisible(false)}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={manualEntryVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setManualEntryVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setManualEntryVisible(false)}
          >
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Manual entry</Text>
              <Text style={styles.modalBody}>
                Pick a start and end time. If the end time is earlier than the start time,
                it will be treated as the next day.
              </Text>

              <View style={styles.manualRow}>
                <Text style={styles.manualLabel}>Start</Text>
                <Pressable
                  style={[
                    styles.manualChip,
                    activeManualField === 'start' && styles.manualChipActive,
                  ]}
                  onPress={() => {
                    setActiveManualField('start');
                    if (Platform.OS === 'android') setShowManualPicker(true);
                  }}
                >
                  <Text
                    style={[
                      styles.manualChipText,
                      activeManualField === 'start' && styles.manualChipTextActive,
                    ]}
                  >
                    {manualStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.manualRow}>
                <Text style={styles.manualLabel}>End</Text>
                <Pressable
                  style={[
                    styles.manualChip,
                    activeManualField === 'end' && styles.manualChipActive,
                  ]}
                  onPress={() => {
                    setActiveManualField('end');
                    if (Platform.OS === 'android') setShowManualPicker(true);
                  }}
                >
                  <Text
                    style={[
                      styles.manualChipText,
                      activeManualField === 'end' && styles.manualChipTextActive,
                    ]}
                  >
                    {manualEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </Pressable>
              </View>

              {(Platform.OS === 'ios' || showManualPicker) && (
                <>
                  <Text style={styles.manualEditingLabel}>
                    Editing:{' '}
                    {activeManualField === 'start' ? 'Start time' : 'End time'}
                  </Text>
                <DateTimePicker
                  value={activeManualField === 'start' ? manualStart : manualEnd}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event: any, date?: Date) => {
                    if (Platform.OS === 'android' && event.type === 'dismissed') {
                      setShowManualPicker(false);
                      return;
                    }
                    if (date) {
                      if (activeManualField === 'start') setManualStart(date);
                      else setManualEnd(date);
                    }
                    if (Platform.OS === 'android') setShowManualPicker(false);
                  }}
                  themeVariant="light"
                  textColor={Platform.OS === 'ios' ? '#000000' : undefined}
                  accentColor={Platform.OS === 'ios' ? '#000000' : undefined}
                  style={Platform.OS === 'ios' ? { backgroundColor: '#fff' } : undefined}
                />
                </>
              )}

              <View style={styles.modalButtonsRow}>
                <Pressable
                  style={styles.modalSecondaryButton}
                  onPress={() => {
                    setShowManualPicker(false);
                    setManualEntryVisible(false);
                  }}
                >
                  <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalPrimaryWide]}
                  onPress={handleSaveManualEntry}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

function SwipeToDeleteRow({
  children,
  onDelete,
  rightActionWidth = 86,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  rightActionWidth?: number;
}) {
  const translateX = useState(() => new Animated.Value(0))[0];

  const panResponder = useState(() =>
    PanResponder.create({
      // Be forgiving: allow some vertical “slip” while swiping left.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 0.6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        // swipe left only, clamp -rightActionWidth..0
        const x = Math.min(0, Math.max(-rightActionWidth, g.dx));
        translateX.setValue(x);
      },
      onPanResponderRelease: (_, g) => {
        const shouldDelete = g.dx < -rightActionWidth * 0.9;
        const shouldReveal = g.dx < -rightActionWidth * 0.35;
        if (shouldDelete) {
          Animated.timing(translateX, {
            toValue: -rightActionWidth,
            duration: 120,
            useNativeDriver: true,
          }).start(() => onDelete());
          return;
        }
        Animated.spring(translateX, {
          toValue: shouldReveal ? -rightActionWidth : 0,
          useNativeDriver: true,
          friction: 9,
          tension: 80,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 80,
        }).start();
      },
    })
  )[0];

  return (
    <View style={styles.swipeWrap}>
      <View style={[styles.deleteBg, { width: rightActionWidth }]}>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete sleep log entry"
          hitSlop={10}
        >
          <Text style={styles.deleteX}>×</Text>
        </Pressable>
      </View>
      <Animated.View
        style={[styles.swipeFg, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  topRow: { marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backText: { fontSize: 16, fontWeight: '700', color: '#111' },
  refreshText: { fontSize: 14, fontWeight: '700', color: '#555' },
  actionRow: { marginTop: 4, marginBottom: 10, alignItems: 'center' },
  addButton: {
    backgroundColor: '#111',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  addButtonText: { color: '#fff', fontWeight: '900' },
  title: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 10,
    color: '#111',
    textAlign: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  streakText: { fontSize: 20, fontWeight: '800', color: '#111' },
  streakSub: { fontSize: 13, fontWeight: '600', color: '#666' },

  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },

  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  placeholder: {
    minHeight: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  graphPlaceholder: { minHeight: 160 },
  placeholderText: { color: '#777', fontWeight: '600' },

  statBox: {
    minHeight: 56,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111' },

  graphWrap: { minHeight: 160, justifyContent: 'center' },
  graphRow: { flexDirection: 'row', alignItems: 'stretch' },
  yAxis: { width: 38, paddingRight: 8, alignItems: 'flex-end' },
  yAxisSpacer: { flex: 1 },
  yAxisText: { color: '#777', fontWeight: '700', fontSize: 12 },
  graphBars: { flex: 1, height: 130, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 6 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: '#333', borderRadius: 8 },
  graphHint: { marginTop: 10, textAlign: 'center', color: '#777', fontWeight: '600' },

  log: { gap: 10 },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 10,
  },
  logLeft: { flex: 1 },
  logRight: { alignItems: 'flex-end' },
  logDate: { fontWeight: '800', color: '#111' },
  logMain: { fontWeight: '800', color: '#111' },
  logSub: { marginTop: 2, color: '#777', fontWeight: '600' },

  infoDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDotText: { color: '#fff', fontWeight: '900', fontSize: 12, marginTop: -1 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 16,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#111', marginBottom: 8 },
  modalBody: { color: '#333', fontWeight: '600', lineHeight: 20 },
  modalButton: {
    marginTop: 14,
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalButtonText: { color: '#fff', fontWeight: '800' },
  modalButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' },
  modalSecondaryButton: {
    flex: 1,
    marginTop: 14,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  modalSecondaryButtonText: { color: '#111', fontWeight: '800' },
  modalPrimaryWide: { flex: 1.6 },

  manualRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  manualLabel: { fontWeight: '800', color: '#111' },
  manualChip: {
    backgroundColor: '#f2f2f2',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  manualChipActive: { backgroundColor: '#111', borderColor: '#111' },
  manualChipText: { fontWeight: '800', color: '#111' },
  manualChipTextActive: { color: '#fff' },
  manualEditingLabel: {
    marginTop: 10,
    marginBottom: 4,
    fontWeight: '700',
    color: '#555',
  },

  swipeWrap: { position: 'relative' },
  deleteBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#e5484d',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteX: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: -2 },
  swipeFg: { borderRadius: 10 },
});

