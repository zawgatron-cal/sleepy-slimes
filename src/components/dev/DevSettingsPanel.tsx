/**
 * Dev-only toggles for testing (Slimepedia unlock, etc.).
 */

import { useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { clearSlimepediaDiscoveries } from '@/src/db';
import { invalidateSlimepediaDiscoveriesCache } from '@/src/hooks/useSlimepediaDetailData';
import { useDevSettingsStore } from '@/src/stores/useDevSettingsStore';
import { createAppStyles } from '@/src/theme/createAppStyles';

export function DevSettingsPanel() {
  const unlockSlimepedia = useDevSettingsStore((s) => s.unlockSlimepedia);
  const setUnlockSlimepedia = useDevSettingsStore((s) => s.setUnlockSlimepedia);
  const bumpSlimeArtCache = useDevSettingsStore((s) => s.bumpSlimeArtCache);
  const [resettingDiscoveries, setResettingDiscoveries] = useState(false);

  const handleResetDiscoveries = () => {
    Alert.alert(
      'Reset slimepedia discoveries?',
      'Clears all species discovery records. Your slimes stay in the collection; new earns will re-discover species.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setResettingDiscoveries(true);
              try {
                await clearSlimepediaDiscoveries();
                invalidateSlimepediaDiscoveriesCache();
              } catch (e) {
                console.warn('clearSlimepediaDiscoveries failed', e);
                Alert.alert('Reset failed', String(e));
              } finally {
                setResettingDiscoveries(false);
              }
            })();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>Dev settings</Text>

      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchLabel}>Unlock Slimepedia</Text>
          <Text style={styles.hint}>Show all species entries as discovered.</Text>
        </View>
        <Switch value={unlockSlimepedia} onValueChange={setUnlockSlimepedia} />
      </View>

      <View style={styles.artRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchLabel}>Slimepedia discoveries</Text>
          <Text style={styles.hint}>
            Wipe discovery records so the catalog shows silhouettes again (unless Unlock
            Slimepedia is on).
          </Text>
        </View>
        <Pressable
          style={[styles.dangerBtn, resettingDiscoveries && styles.btnDisabled]}
          onPress={handleResetDiscoveries}
          disabled={resettingDiscoveries}
        >
          <Text style={styles.dangerBtnText}>
            {resettingDiscoveries ? 'Resetting…' : 'Reset discoveries'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.artRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchLabel}>Slime PNGs not updating?</Text>
          <Text style={styles.hint}>
            Save to assets/slimes/standard/ (lowercase names). Tap refresh, press r in
            Metro, or run npm run start:clear. Identical stub PNGs look the same until
            replaced with unique art.
          </Text>
        </View>
        <Pressable style={styles.refreshBtn} onPress={bumpSlimeArtCache}>
          <Text style={styles.refreshBtnText}>Refresh slime art</Text>
        </Pressable>
      </View>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  switchCopy: { flex: 1 },
  switchLabel: { fontSize: 13, color: '#ccc', fontWeight: '600' },
  hint: { fontSize: 11, color: '#666', marginTop: 4, lineHeight: 15 },
  artRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 10,
  },
  refreshBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3d5a80',
    borderRadius: 6,
  },
  refreshBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  dangerBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#8a3a3a',
    borderRadius: 6,
  },
  dangerBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnDisabled: { opacity: 0.55 },
});
