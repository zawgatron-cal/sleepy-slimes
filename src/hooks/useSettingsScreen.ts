import { useCallback, useState } from 'react';
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import {
  getNotificationPermissionStatus,
  requestPermissions,
  type NotificationPermissionStatus,
} from '@/src/services/alarmNotifications';
import { useSoundSettingsStore } from '@/src/stores/useSoundSettingsStore';
import { useAnimationSettingsStore } from '@/src/stores/useAnimationSettingsStore';

export function useSettingsScreen() {
  const musicEnabled = useSoundSettingsStore((s) => s.musicEnabled);
  const sfxEnabled = useSoundSettingsStore((s) => s.sfxEnabled);
  const musicVolume = useSoundSettingsStore((s) => s.musicVolume);
  const sfxVolume = useSoundSettingsStore((s) => s.sfxVolume);
  const setMusicEnabled = useSoundSettingsStore((s) => s.setMusicEnabled);
  const setSfxEnabled = useSoundSettingsStore((s) => s.setSfxEnabled);
  const setMusicVolume = useSoundSettingsStore((s) => s.setMusicVolume);
  const setSfxVolume = useSoundSettingsStore((s) => s.setSfxVolume);
  const revealAnimationsEnabled = useAnimationSettingsStore((s) => s.revealAnimationsEnabled);
  const overlayAnimationsEnabled = useAnimationSettingsStore((s) => s.overlayAnimationsEnabled);
  const setRevealAnimationsEnabled = useAnimationSettingsStore((s) => s.setRevealAnimationsEnabled);
  const setOverlayAnimationsEnabled = useAnimationSettingsStore((s) => s.setOverlayAnimationsEnabled);

  const [notificationStatus, setNotificationStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [requestingNotifications, setRequestingNotifications] = useState(false);

  const refreshNotificationStatus = useCallback(async () => {
    setNotificationStatus(await getNotificationPermissionStatus());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshNotificationStatus();
    }, [refreshNotificationStatus])
  );

  const notificationStatusLabel =
    notificationStatus === 'granted'
      ? 'On'
      : notificationStatus === 'denied'
        ? 'Off — enable in system settings'
        : 'Not set up yet';

  const notificationActionLabel =
    notificationStatus === 'granted'
      ? 'Manage in settings'
      : notificationStatus === 'denied'
        ? 'Open system settings'
        : 'Enable notifications';

  const handleNotificationAction = useCallback(async () => {
    if (notificationStatus === 'granted' || notificationStatus === 'denied') {
      await Linking.openSettings();
      return;
    }
    setRequestingNotifications(true);
    try {
      await requestPermissions();
      await refreshNotificationStatus();
    } finally {
      setRequestingNotifications(false);
    }
  }, [notificationStatus, refreshNotificationStatus]);

  const appVersion =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0';
  const buildLabel = Constants.nativeBuildVersion
    ? ` (${Constants.nativeBuildVersion})`
    : '';

  return {
    musicEnabled,
    sfxEnabled,
    musicVolume,
    sfxVolume,
    setMusicEnabled,
    setSfxEnabled,
    setMusicVolume,
    setSfxVolume,
    revealAnimationsEnabled,
    overlayAnimationsEnabled,
    setRevealAnimationsEnabled,
    setOverlayAnimationsEnabled,
    notificationStatus,
    notificationStatusLabel,
    notificationActionLabel,
    requestingNotifications,
    handleNotificationAction,
    appVersion: `${appVersion}${buildLabel}`,
    platformLabel: Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS,
  };
}
