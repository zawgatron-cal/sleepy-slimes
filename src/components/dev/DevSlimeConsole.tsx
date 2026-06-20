/**
 * Dev — text command console for granting slimes and tweaking save data.
 */

import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  DEV_CONSOLE_EXAMPLES,
  DEV_CONSOLE_WELCOME,
  executeDevConsoleCommand,
  grantAllSpeciesByVariant,
  type DevConsoleLine,
} from '@/src/services/devConsole';
import { SlimeVariant } from '@/src/constants/game';
import { createAppStyles } from '@/src/theme/createAppStyles';

type Props = {
  onApplied?: () => void;
};

type LogEntry = DevConsoleLine & { id: number };

let logId = 0;

function toneColor(tone: DevConsoleLine['tone']): string {
  switch (tone) {
    case 'ok':
      return '#7dffb3';
    case 'error':
      return '#ff8a8a';
    default:
      return '#c8d0dc';
  }
}

export function DevSlimeConsole({ onApplied }: Props) {
  const [input, setInput] = useState('');
  const [log, setLog] = useState<LogEntry[]>([{ id: logId++, text: DEV_CONSOLE_WELCOME, tone: 'info' }]);
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const appendLog = useCallback((lines: DevConsoleLine[], command?: string) => {
    setLog((prev) => {
      const next: LogEntry[] = [...prev];
      if (command) {
        next.push({ id: logId++, text: `> ${command}`, tone: 'info' });
      }
      for (const entry of lines) {
        next.push({ id: logId++, ...entry });
      }
      return next.slice(-120);
    });
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const runCommand = useCallback(
    async (command: string) => {
      const trimmed = command.trim();
      if (!trimmed || running) return;

      setRunning(true);
      try {
        const result = await executeDevConsoleCommand(trimmed);
        appendLog(result.lines, trimmed);
        if (result.ok) {
          onApplied?.();
        }
      } catch (e) {
        appendLog([{ text: String(e), tone: 'error' }], trimmed);
      } finally {
        setRunning(false);
        setInput('');
      }
    },
    [appendLog, onApplied, running]
  );

  const runGrantAll = useCallback(
    async (variant: SlimeVariant, label: string) => {
      if (running) return;

      setRunning(true);
      try {
        const result = await grantAllSpeciesByVariant(variant);
        appendLog(result.lines, `grant all ${label.toLowerCase()}`);
        if (result.ok) {
          onApplied?.();
        }
      } catch (e) {
        appendLog([{ text: String(e), tone: 'error' }], `grant all ${label.toLowerCase()}`);
      } finally {
        setRunning(false);
      }
    },
    [appendLog, onApplied, running]
  );

  return (
    <KeyboardAvoidingView
      style={styles.block}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={64}
    >
      <Text style={styles.sectionTitle}>Dev console</Text>
      <Text style={styles.hint}>
        Grant any species with variant, level, nights, nickname, and more. Changes write to your save.
      </Text>

      <View style={styles.terminal}>
        <ScrollView ref={scrollRef} style={styles.logScroll} nestedScrollEnabled>
          {log.map((entry) => (
            <Text key={entry.id} style={[styles.logLine, { color: toneColor(entry.tone) }]}>
              {entry.text}
            </Text>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <Text style={styles.prompt}>{'>'}</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder='grant grass_slime gold 5 --equip'
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={() => runCommand(input)}
            editable={!running}
          />
          <Pressable
            style={[styles.runBtn, running && styles.runBtnDisabled]}
            onPress={() => runCommand(input)}
            disabled={running}
          >
            <Text style={styles.runBtnText}>Run</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.label}>Spawn every species</Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.spawnBtn, running && styles.runBtnDisabled]}
          onPress={() => runGrantAll(SlimeVariant.EXOTIC, 'Exotic')}
          disabled={running}
        >
          <Text style={styles.spawnBtnText}>All Exotic</Text>
        </Pressable>
        <Pressable
          style={[styles.spawnBtn, running && styles.runBtnDisabled]}
          onPress={() => runGrantAll(SlimeVariant.PRISMATIC, 'Prismatic')}
          disabled={running}
        >
          <Text style={styles.spawnBtnText}>All Prismatic</Text>
        </Pressable>
        <Pressable
          style={[styles.spawnBtn, styles.spawnBtnGold, running && styles.runBtnDisabled]}
          onPress={() => runGrantAll(SlimeVariant.GOLD, 'Gold')}
          disabled={running}
        >
          <Text style={styles.spawnBtnText}>All Gold</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Examples</Text>
      <View style={styles.chipRow}>
        {DEV_CONSOLE_EXAMPLES.map((example) => (
          <Pressable
            key={example}
            style={styles.chip}
            onPress={() => setInput(example)}
          >
            <Text style={styles.chipText}>{example}</Text>
          </Pressable>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = createAppStyles({
  block: { marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#aaa', marginTop: 8, marginBottom: 6 },
  hint: { fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 18 },
  terminal: {
    backgroundColor: '#0f1419',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  logScroll: { maxHeight: 220, padding: 10 },
  logLine: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  prompt: { color: '#7dffb3', fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },
  input: {
    flex: 1,
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    paddingVertical: 6,
  },
  runBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3d5a80',
    borderRadius: 6,
  },
  runBtnDisabled: { opacity: 0.5 },
  runBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  label: { fontSize: 12, color: '#888', marginTop: 10, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
  },
  chipText: { color: '#ccc', fontSize: 10, fontFamily: 'monospace' },
  spawnBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#4a3d80',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6a5aa0',
  },
  spawnBtnGold: {
    backgroundColor: '#6b4e00',
    borderColor: '#a67c00',
  },
  spawnBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
