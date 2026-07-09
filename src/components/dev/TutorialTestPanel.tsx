/**
 * Dev-only controls for contextual tutorial onboarding.
 */

import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TUTORIAL_STEPS } from '@/src/constants/tutorial';
import { useTutorialStore, type TutorialStepId } from '@/src/stores';
import { createAppStyles } from '@/src/theme/createAppStyles';

const STEP_LABELS: Record<TutorialStepId, string> = {
  welcome: 'Welcome dialogue',
  zone_select: 'Welcome complete (legacy step)',
  start_sleep: 'First valid sleep finished',
  collection_rarity: 'Collection rarity dialogue',
  buddy_guide: 'Buddy equip (Grass Slime)',
  fuse_unlock: 'Kate unlocks Fuse tab',
  fusion_guide: 'Fusion intro (optional)',
  zone_unlock_guide: 'Zone unlock (first Ultra Rare)',
  slimepedia_guide: 'Slimepedia intro (after zones)',
};

type Preset = {
  label: string;
  hint: string;
  steps: TutorialStepId[];
  route?: '/(tabs)/index' | '/(tabs)/collection' | '/(tabs)/fusion';
};

const PRESETS: Preset[] = [
  {
    label: 'First night',
    hint: 'Welcome only. Fuse & Collection tabs show as locked empty slots.',
    steps: [],
    route: '/(tabs)/index',
  },
  {
    label: 'First morning',
    hint: 'Collection unlocked. Jump here after start_sleep or complete a sleep.',
    steps: ['welcome', 'zone_select', 'start_sleep'],
    route: '/(tabs)/collection',
  },
  {
    label: 'Fusion tab',
    hint: 'Fuse unlocked after fuse_unlock. Needs slimes + candies.',
    steps: ['welcome', 'zone_select', 'start_sleep', 'collection_rarity', 'buddy_guide', 'fuse_unlock'],
    route: '/(tabs)/fusion',
  },
];

export function TutorialTestPanel() {
  const router = useRouter();
  const completedSteps = useTutorialStore((s) => s.completedSteps);
  const fusionIntroSeen = useTutorialStore((s) => s.fusionIntroSeen);
  const resetTutorial = useTutorialStore((s) => s.resetTutorial);
  const setCompletedSteps = useTutorialStore((s) => s.setCompletedSteps);
  const resetFusionIntroSeen = useTutorialStore((s) => s.resetFusionIntroSeen);
  const markZoneUnlockTutorialPending = useTutorialStore((s) => s.markZoneUnlockTutorialPending);
  const [busy, setBusy] = useState(false);

  const replayPostUrTutorials = () => {
    setBusy(true);
    try {
      const withoutPostUr = completedSteps.filter(
        (step) => step !== 'zone_unlock_guide' && step !== 'slimepedia_guide'
      );
      setCompletedSteps(withoutPostUr);
      markZoneUnlockTutorialPending();
      router.push('/(tabs)/index');
    } finally {
      setBusy(false);
    }
  };

  const applyPreset = (preset: Preset) => {
    setBusy(true);
    try {
      setCompletedSteps([...preset.steps]);
      if (preset.route) {
        router.push(preset.route);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset tutorial?',
      'Clears all completed steps. Use “Clear slimes & candies” above if you want the welcome dialogue again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetTutorial(),
        },
      ]
    );
  };

  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>Tutorial</Text>
      <Text style={styles.hint}>
        Contextual onboarding with Sprout. Progress persists in player_settings.
      </Text>

      <View style={styles.stepList}>
        {TUTORIAL_STEPS.map((step) => {
          const done = completedSteps.includes(step);
          return (
            <Text key={step} style={[styles.stepRow, done && styles.stepDone]}>
              {done ? '✓' : '○'} {STEP_LABELS[step]}
            </Text>
          );
        })}
        <Text style={styles.stepRow}>
          {fusionIntroSeen ? '✓' : '○'} Fusion intro seen (session only)
        </Text>
      </View>

      <View style={styles.btnRow}>
        <Pressable
          style={[styles.secondaryBtn, busy && styles.btnDisabled]}
          onPress={replayPostUrTutorials}
          disabled={busy}
        >
          <Text style={styles.secondaryBtnText}>Replay zone tutorials</Text>
        </Pressable>
        <Pressable
          style={[styles.dangerBtn, busy && styles.btnDisabled]}
          onPress={handleReset}
          disabled={busy}
        >
          <Text style={styles.dangerBtnText}>Reset tutorial</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, busy && styles.btnDisabled]}
          onPress={resetFusionIntroSeen}
          disabled={busy}
        >
          <Text style={styles.secondaryBtnText}>Reset fusion intro</Text>
        </Pressable>
      </View>

      <Text style={styles.subheading}>Jump to step</Text>
      {PRESETS.map((preset) => (
        <Pressable
          key={preset.label}
          style={[styles.presetBtn, busy && styles.btnDisabled]}
          onPress={() => applyPreset(preset)}
          disabled={busy}
        >
          <Text style={styles.presetLabel}>{preset.label}</Text>
          <Text style={styles.hint}>{preset.hint}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = createAppStyles({
  block: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#252525',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9cf',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ccc',
    marginTop: 14,
    marginBottom: 8,
  },
  hint: { fontSize: 11, color: '#666', marginTop: 4, lineHeight: 15 },
  stepList: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    gap: 4,
  },
  stepRow: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  stepDone: { color: '#8fd98f' },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  dangerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#8a3a3a',
    borderRadius: 6,
  },
  dangerBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#444',
    borderRadius: 6,
  },
  secondaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  presetBtn: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  presetLabel: { fontSize: 13, color: '#ccc', fontWeight: '700' },
  btnDisabled: { opacity: 0.55 },
});
