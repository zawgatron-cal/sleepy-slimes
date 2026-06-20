/**
 * Alarm notifications — schedule/cancel local notification for sleep alarm,
 * and in-app looping alarm sound when alarm time is reached during tracking.
 * Uses expo-av for playback (reliable in Expo Go on iOS).
 */

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Bundled alarm sound — loops when alarm fires during sleep tracking. */
const ALARM_SOUND = require('../../assets/audio/alarm.mp3');

let scheduledAlarmId: string | null = null;
let alarmSound: Audio.Sound | null = null;
let loadingAlarmSound: Promise<Audio.Sound> | null = null;

async function ensureAlarmSoundLoaded(): Promise<Audio.Sound> {
  if (alarmSound) return alarmSound;
  if (loadingAlarmSound) return loadingAlarmSound;

  loadingAlarmSound = (async () => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      ALARM_SOUND,
      {
        shouldPlay: false,
        isLooping: false,
        volume: 1.0,
      },
      null,
      true
    );

    alarmSound = sound;
    loadingAlarmSound = null;
    return sound;
  })();

  try {
    return await loadingAlarmSound;
  } catch (e) {
    loadingAlarmSound = null;
    throw e;
  }
}

/**
 * Preload the alarm sound so playback can start instantly later.
 * Safe to call multiple times.
 */
export async function preloadAlarmSound(): Promise<void> {
  try {
    await ensureAlarmSoundLoaded();
  } catch (e) {
    console.warn('preloadAlarmSound failed', e);
  }
}

/** Configure how notifications appear when app is foregrounded. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Android requires a notification channel for reliable alarm-like behavior.
// Without this, notifications can silently arrive or be deprioritized.
if (Platform.OS === 'android') {
  void Notifications.setNotificationChannelAsync('alarm', {
    name: 'Alarm',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
  }).catch((e) => console.warn('setNotificationChannelAsync failed', e));
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

/**
 * Request notification permissions. Call before scheduling.
 * Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule alarm notification at the given timestamp (epoch ms).
 * Cancels any previously scheduled alarm.
 */
export async function scheduleAlarm(alarmAtMs: number): Promise<string | null> {
  if (alarmAtMs <= Date.now()) return null;
  await cancelAlarm();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Sleepy Slimes',
      body: 'Time to wake up! 🌟',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(alarmAtMs),
      ...(Platform.OS === 'android' ? { channelId: 'alarm' } : {}),
    },
  });
  scheduledAlarmId = id;
  return id;
}

/**
 * Cancel the currently scheduled alarm notification and stop any playing alarm sound.
 */
export async function cancelAlarm(): Promise<void> {
  if (scheduledAlarmId) {
    await Notifications.cancelScheduledNotificationAsync(scheduledAlarmId);
    scheduledAlarmId = null;
  }

  if (alarmSound) {
    try {
      await alarmSound.stopAsync();
      await alarmSound.unloadAsync();
    } catch (_) {
      // ignore if already unloaded
    }
    alarmSound = null;
  }
  loadingAlarmSound = null;
}

/**
 * Start the in-app alarm: play a looping alarm sound until stopped.
 * Used while the user is on the tracking screen after alarm time has passed.
 */
export async function startAlarmLoop(): Promise<void> {
  try {
    const sound = await ensureAlarmSoundLoaded();

    if (__DEV__) {
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded) {
          // eslint-disable-next-line no-console
          console.log('[alarm] status', s);
        }
        // isLoaded: false is expected when stopping/unloading; skip to avoid noisy warn
      });
    }

    await sound.setIsLoopingAsync(true);
    await sound.playAsync();
  } catch (e) {
    console.warn('startAlarmLoop failed', e);
  }
}

/** Stop the in-app looping alarm sound. */
export function stopAlarmLoop(): void {
  if (!alarmSound) return;
  const s = alarmSound;
  alarmSound = null;
  (async () => {
    try {
      await s.stopAsync();
      await s.unloadAsync();
    } catch (_) {
      // ignore
    }
  })();
}
