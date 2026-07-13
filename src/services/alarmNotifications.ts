/**
 * Alarm notifications — schedule/cancel local notification for sleep alarm,
 * and in-app looping alarm sound when alarm time is reached during tracking.
 */

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ALARM_SOUND } from '@/src/constants/alarmAssets';
import {
  ensureAlarmAudioMode,
  restoreAppAudioModeAfterAlarm,
} from '@/src/services/audioMode';
import { waitForAudioPlayerLoaded } from '@/src/services/audioPlayerUtils';

let scheduledAlarmId: string | null = null;
let alarmPlayer: AudioPlayer | null = null;
let loadingAlarmPlayer: Promise<AudioPlayer> | null = null;

async function ensureAlarmSoundLoaded(): Promise<AudioPlayer> {
  if (alarmPlayer?.isLoaded) return alarmPlayer;
  if (loadingAlarmPlayer) return loadingAlarmPlayer;

  loadingAlarmPlayer = (async () => {
    await ensureAlarmAudioMode();
    const player = createAudioPlayer(ALARM_SOUND, { keepAudioSessionActive: true });
    player.loop = false;
    player.volume = 1;
    await waitForAudioPlayerLoaded(player);
    alarmPlayer = player;
    loadingAlarmPlayer = null;
    return player;
  })();

  try {
    return await loadingAlarmPlayer;
  } catch (e) {
    loadingAlarmPlayer = null;
    throw e;
  }
}

export async function preloadAlarmSound(): Promise<void> {
  try {
    await ensureAlarmSoundLoaded();
  } catch (e) {
    console.warn('preloadAlarmSound failed', e);
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

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

export async function cancelAlarm(): Promise<void> {
  if (scheduledAlarmId) {
    await Notifications.cancelScheduledNotificationAsync(scheduledAlarmId);
    scheduledAlarmId = null;
  }
  stopAlarmLoop();
}

export async function startAlarmLoop(): Promise<void> {
  try {
    await ensureAlarmAudioMode();
    const player = await ensureAlarmSoundLoaded();
    player.loop = true;
    player.volume = 1;
    player.play();
  } catch (e) {
    console.warn('startAlarmLoop failed', e);
  }
}

export function stopAlarmLoop(): void {
  if (!alarmPlayer) return;
  try {
    alarmPlayer.loop = false;
    alarmPlayer.pause();
    void alarmPlayer.seekTo(0);
  } catch {
    // ignore
  }
  void restoreAppAudioModeAfterAlarm();
}

export async function unloadAlarmSound(): Promise<void> {
  stopAlarmLoop();
  if (!alarmPlayer) return;
  try {
    alarmPlayer.remove();
  } catch {
    // ignore
  }
  alarmPlayer = null;
  loadingAlarmPlayer = null;
}
