/**
 * Shared expo-audio session configuration.
 */

import { setAudioModeAsync } from 'expo-audio';

let appModeReady = false;

/** Default — BGM + SFX mix with other apps. */
export async function ensureAppAudioMode(): Promise<void> {
  if (appModeReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'mixWithOthers',
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
  });
  appModeReady = true;
}

/** Alarm takes focus while ringing during sleep tracking. */
export async function ensureAlarmAudioMode(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'doNotMix',
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
  });
}

/** Restore mix-friendly mode after alarm stops. */
export async function restoreAppAudioModeAfterAlarm(): Promise<void> {
  appModeReady = false;
  await ensureAppAudioMode();
}
