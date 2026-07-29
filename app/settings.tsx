/**
 * Settings — notifications, shortcuts, about.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OutlinedSvgLabel } from '@/src/components/OutlinedSvgLabel';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, SUPPORT_URL } from '@/src/constants/legal';
import { useSettingsScreen } from '@/src/hooks/useSettingsScreen';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const t = mainScreens.settings;

export default function SettingsScreen() {
  const router = useRouter();
  const screen = useSettingsScreen();

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
              text="Settings"
              fontSize={34}
              height={48}
              baselineY={38}
              strokeWidth={1.8}
              strokeColor={mainScreens.idle.specialTextBorder}
              fillColor={mainScreens.idle.specialTextFill}
              textAnchor="middle"
              style={styles.titleLabel}
              defaultWidth={180}
            />
          </View>
        </View>

        <SectionTitle>Notifications</SectionTitle>
        <View style={styles.panel}>
          <SettingsRow
            label="Sleep alarm"
            detail="Wake-up alerts when a sleep alarm is set"
            value={screen.notificationStatusLabel}
          />
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
              screen.requestingNotifications && styles.actionButtonDisabled,
            ]}
            onPress={() => void screen.handleNotificationAction()}
            disabled={screen.requestingNotifications}
            accessibilityRole="button"
            accessibilityLabel={screen.notificationActionLabel}
          >
            {screen.requestingNotifications ? (
              <ActivityIndicator color={t.actionButtonText} />
            ) : (
              <Text style={styles.actionButtonText}>{screen.notificationActionLabel}</Text>
            )}
          </Pressable>
        </View>

        <SectionTitle>Sound</SectionTitle>
        <View style={styles.panel}>
          <SoundToggleSection
            label="Music"
            detail="Background music in the app"
            enabled={screen.musicEnabled}
            onEnabledChange={screen.setMusicEnabled}
            volume={screen.musicVolume}
            onVolumeChange={screen.setMusicVolume}
          />
          <SoundToggleSection
            label="Sound effects"
            detail="UI taps and game feedback sounds"
            enabled={screen.sfxEnabled}
            onEnabledChange={screen.setSfxEnabled}
            volume={screen.sfxVolume}
            onVolumeChange={screen.setSfxVolume}
          />
        </View>

        <SectionTitle>Display</SectionTitle>
        <View style={styles.panel}>
          <SettingsToggleRow
            label="Reveal animations"
            detail="Sleep, fusion, collection pop-in, and candy collect"
            value={screen.revealAnimationsEnabled}
            onValueChange={screen.setRevealAnimationsEnabled}
          />
          <SettingsToggleRow
            label="Overlay animations"
            detail="Foil effects and modal transitions"
            value={screen.overlayAnimationsEnabled}
            onValueChange={screen.setOverlayAnimationsEnabled}
          />
        </View>

        <SectionTitle>About</SectionTitle>
        <View style={styles.panel}>
          <SettingsRow label="App" value="Sleepy Slimes" />
          <SettingsRow label="Version" value={screen.appVersion} />
          <SettingsRow label="Platform" value={screen.platformLabel} />
          <SettingsLinkRow
            label="Help & FAQ"
            detail="Alarms, sleep credit, and fusion questions"
            url={SUPPORT_URL}
          />
          <SettingsLinkRow
            label="Privacy Policy"
            detail="How your sleep and collection data is stored"
            url={PRIVACY_POLICY_URL}
          />
          <SettingsLinkRow
            label="Contact support"
            detail={SUPPORT_EMAIL}
            url={`mailto:${SUPPORT_EMAIL}`}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function SettingsRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function SettingsLinkRow({
  label,
  detail,
  url,
}: {
  label: string;
  detail?: string;
  url: string;
}) {
  return (
    <Pressable
      onPress={() => {
        void Linking.openURL(url);
      }}
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <View style={[styles.row, styles.linkRowCopy]}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <Text style={styles.linkChevron}>›</Text>
    </Pressable>
  );
}

const SWITCH_TRACK_WIDTH = 51;
const SWITCH_TRACK_HEIGHT = 31;
const SWITCH_THUMB_SIZE = 27;
const SWITCH_THUMB_TRAVEL = SWITCH_TRACK_WIDTH - SWITCH_THUMB_SIZE - 4;

function SettingsSwitch({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (enabled: boolean) => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[styles.switchTrack, value ? styles.switchTrackOn : styles.switchTrackOff]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.switchThumb,
          value ? styles.switchThumbOn : styles.switchThumbOff,
          { transform: [{ translateX: value ? SWITCH_THUMB_TRAVEL : 0 }] },
        ]}
      />
    </Pressable>
  );
}

function SettingsToggleRow({
  label,
  detail,
  value,
  onValueChange,
}: {
  label: string;
  detail?: string;
  value: boolean;
  onValueChange: (enabled: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <SettingsSwitch value={value} onValueChange={onValueChange} label={label} />
    </View>
  );
}

const VOLUME_TRACK_HEIGHT = 28;
const VOLUME_THUMB_SIZE = VOLUME_TRACK_HEIGHT;
const VOLUME_HIT_HEIGHT = 44;
const VOLUME_TRACK_VERTICAL_INSET = (VOLUME_HIT_HEIGHT - VOLUME_TRACK_HEIGHT) / 2;

function volumeFromLocalX(localX: number, trackWidth: number): number {
  const travel = trackWidth - VOLUME_THUMB_SIZE;
  if (travel <= 0) return 0;
  return Math.max(0, Math.min(1, (localX - VOLUME_THUMB_SIZE / 2) / travel));
}

function VolumeBar({
  value,
  onValueChange,
  label,
}: {
  value: number;
  onValueChange: (volume: number) => void;
  label: string;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackPageXRef = useRef(0);
  const travel = Math.max(0, trackWidth - VOLUME_THUMB_SIZE);
  const thumbCenterX = VOLUME_THUMB_SIZE / 2 + travel * value;
  const thumbLeft = thumbCenterX - VOLUME_THUMB_SIZE / 2;
  const displayPercent = Math.round(value * 100);
  const isFull = value >= 0.995;
  const fillWidth =
    isFull && trackWidth > 0
      ? trackWidth
      : Math.max(VOLUME_THUMB_SIZE / 2, thumbCenterX);

  const trackRef = useRef<View>(null);
  const syncTrackPageX = useCallback(() => {
    trackRef.current?.measureInWindow((x) => {
      trackPageXRef.current = x;
    });
  }, []);

  const updateFromPageX = useCallback(
    (pageX: number) => {
      if (trackWidth <= VOLUME_THUMB_SIZE) return;
      const localX = pageX - trackPageXRef.current;
      onValueChange(volumeFromLocalX(localX, trackWidth));
    },
    [onValueChange, trackWidth]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (evt) => {
          syncTrackPageX();
          updateFromPageX(evt.nativeEvent.pageX);
        },
        onPanResponderMove: (evt) => updateFromPageX(evt.nativeEvent.pageX),
      }),
    [syncTrackPageX, updateFromPageX]
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
    syncTrackPageX();
  };

  return (
    <View style={styles.volumeBlock}>
      <View style={styles.volumeHeader}>
        <Text style={styles.volumeLabel}>Volume</Text>
        <Text style={styles.volumePercent}>{displayPercent}%</Text>
      </View>
      <View
        ref={trackRef}
        style={styles.volumeTrackHit}
        onLayout={onTrackLayout}
        accessibilityRole="adjustable"
        accessibilityLabel={`${label} volume`}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: displayPercent,
          text: `${displayPercent} percent`,
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.volumeTrack}>
          <View
            style={[
              styles.volumeFill,
              { width: fillWidth },
              isFull && styles.volumeFillAtMax,
            ]}
          />
        </View>
        <View
          pointerEvents="none"
          style={[styles.volumeThumb, { left: thumbLeft }]}
        />
      </View>
    </View>
  );
}

function SoundToggleSection({
  label,
  detail,
  enabled,
  onEnabledChange,
  volume,
  onVolumeChange,
}: {
  label: string;
  detail?: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}) {
  return (
    <View style={styles.soundSection}>
      <SettingsToggleRow
        label={label}
        detail={detail}
        value={enabled}
        onValueChange={onEnabledChange}
      />
      {enabled ? (
        <VolumeBar value={volume} onValueChange={onVolumeChange} label={label} />
      ) : null}
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
    minWidth: 220,
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
  panel: {
    backgroundColor: t.panel,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  row: { gap: 4 },
  rowLabel: { fontSize: 16, fontWeight: '800', color: t.rowLabel },
  rowDetail: { fontSize: 13, fontWeight: '600', color: t.rowMuted, lineHeight: 18 },
  rowValue: { fontSize: 15, fontWeight: '700', color: t.rowValue },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
  },
  linkRowPressed: { opacity: 0.6 },
  linkRowCopy: { flex: 1 },
  linkChevron: { fontSize: 24, fontWeight: '800', color: t.rowLabel },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleCopy: { flex: 1, gap: 4 },
  switchTrack: {
    width: SWITCH_TRACK_WIDTH,
    height: SWITCH_TRACK_HEIGHT,
    borderRadius: SWITCH_TRACK_HEIGHT / 2,
    padding: 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  switchTrackOff: {
    backgroundColor: t.switchTrackOff,
  },
  switchTrackOn: {
    backgroundColor: t.switchTrackOn,
  },
  switchThumb: {
    width: SWITCH_THUMB_SIZE,
    height: SWITCH_THUMB_SIZE,
    borderRadius: SWITCH_THUMB_SIZE / 2,
  },
  switchThumbOff: {
    backgroundColor: t.switchThumbOff,
  },
  switchThumbOn: {
    backgroundColor: t.switchThumbOn,
  },
  soundSection: {
    gap: 10,
  },
  volumeBlock: {
    gap: 6,
    paddingLeft: 2,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volumeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: t.volumeLabel,
  },
  volumePercent: {
    fontSize: 13,
    fontWeight: '800',
    color: t.volumeLabel,
  },
  volumeTrackHit: {
    minHeight: VOLUME_HIT_HEIGHT,
    justifyContent: 'center',
  },
  volumeTrack: {
    height: VOLUME_TRACK_HEIGHT,
    borderRadius: VOLUME_TRACK_HEIGHT / 2,
    backgroundColor: t.volumeTrack,
    overflow: 'hidden',
  },
  volumeFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: VOLUME_TRACK_HEIGHT / 2,
    borderBottomLeftRadius: VOLUME_TRACK_HEIGHT / 2,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: t.volumeFill,
  },
  volumeFillAtMax: {
    borderTopRightRadius: VOLUME_TRACK_HEIGHT / 2,
    borderBottomRightRadius: VOLUME_TRACK_HEIGHT / 2,
  },
  volumeThumb: {
    position: 'absolute',
    top: VOLUME_TRACK_VERTICAL_INSET,
    width: VOLUME_THUMB_SIZE,
    height: VOLUME_THUMB_SIZE,
    borderRadius: VOLUME_THUMB_SIZE / 2,
    backgroundColor: t.volumeThumb,
    borderWidth: 2,
    borderColor: t.volumeThumbBorder,
    zIndex: 2,
  },
  actionButton: {
    backgroundColor: t.actionButtonBg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  actionButtonPressed: { opacity: 0.85 },
  actionButtonDisabled: { opacity: 0.7 },
  actionButtonText: {
    color: t.actionButtonText,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
