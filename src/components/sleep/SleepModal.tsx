/**
 * Pre-sleep modal: optional alarm time, confirm to start tracking.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  formatTime,
  computeNextAlarmDateFromTime,
  getDefaultAlarmDate,
} from '@/src/utils/sleepScreen';

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
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>All ready to sleep?</Text>
          <Text style={styles.bedtime}>Bedtime {formatTime(Date.now())}</Text>

          <View style={styles.alarmRow}>
            <Text style={styles.alarmLabel}>Alarm</Text>
            <View style={styles.alarmActions}>
              <Pressable
                style={[styles.alarmOption, !alarmDate && styles.alarmOptionActive]}
                onPress={() => {
                  onAlarmDateChange(null);
                  setShowPicker(false);
                }}
              >
                <Text
                  style={[styles.alarmOptionText, !alarmDate && styles.alarmOptionTextActive]}
                >
                  No alarm
                </Text>
              </Pressable>
              <Pressable
                style={[styles.alarmOption, alarmDate && styles.alarmOptionActive]}
                onPress={() => {
                  if (!alarmDate) onAlarmDateChange(getDefaultAlarmDate());
                  setShowPicker(true);
                }}
              >
                <Text
                  style={[styles.alarmOptionText, alarmDate && styles.alarmOptionTextActive]}
                >
                  {alarmDate ? formatTime(alarmDate.getTime()) : 'Set'}
                </Text>
              </Pressable>
            </View>
          </View>

          {showPicker && (
            <DateTimePicker
              value={alarmDate ?? new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
              themeVariant="light"
              textColor={Platform.OS === 'ios' ? '#000000' : undefined}
              accentColor={Platform.OS === 'ios' ? '#000000' : undefined}
              style={Platform.OS === 'ios' ? { backgroundColor: '#fff' } : undefined}
            />
          )}

          <View style={styles.rowButtons}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.sleepButton} onPress={onConfirm}>
              <Text style={styles.primaryButtonText}>Sleep</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  bedtime: { fontSize: 15, color: '#333', marginBottom: 12 },
  alarmRow: { marginBottom: 16 },
  alarmLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  alarmActions: { flexDirection: 'row', gap: 8 },
  alarmOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  alarmOptionActive: { backgroundColor: '#333', borderColor: '#333' },
  alarmOptionText: { fontSize: 14, color: '#333' },
  alarmOptionTextActive: { color: '#ffffff' },
  rowButtons: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelButtonText: { fontSize: 16, color: '#666' },
  sleepButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
