/**
 * Dev — preview fusion reveal animations (new species vs duplicate).
 */

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SlimeVariant } from '@/src/constants/game';
import { FusionRevealOverlay } from '@/src/components/fusion/FusionRevealOverlay';
import {
  buildFusionRevealTestSession,
  describeFusionRevealTestSession,
  type FusionRevealTestSession,
} from '@/src/services/devFusionRevealTest';
import type { Species } from '@/src/types';
import { createAppStyles } from '@/src/theme/createAppStyles';

type FusionAnimationTestPanelProps = {
  speciesList: Species[];
};

export function FusionAnimationTestPanel({ speciesList }: FusionAnimationTestPanelProps) {
  const [session, setSession] = useState<FusionRevealTestSession | null>(null);
  const [revealKey, setRevealKey] = useState(0);

  const previewSession = buildFusionRevealTestSession(speciesList, true);
  const previewLabel = previewSession ? describeFusionRevealTestSession(previewSession) : null;
  const disabled = speciesList.length === 0 || !previewSession;

  const launch = (isNewSpecies: boolean, resultVariant?: SlimeVariant) => {
    const nextSession = buildFusionRevealTestSession(speciesList, isNewSpecies, resultVariant);
    if (!nextSession) return;
    setRevealKey((key) => key + 1);
    setSession(nextSession);
  };

  const dismiss = () => setSession(null);

  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>Fusion animation test</Text>
      <Text style={styles.hint}>
        Preview-only overlay — does not fuse slimes or write to SQLite.
        {previewLabel ? ` Uses ${previewLabel.split(' (')[0]} (Ultra Rare).` : ''}
      </Text>

      <View style={styles.btnRow}>
        <Pressable
          style={[styles.launchBtn, styles.launchBtnNew, disabled && styles.btnDisabled]}
          onPress={() => launch(true)}
          disabled={disabled}
        >
          <Text style={styles.launchBtnText}>New fusion</Text>
          <Text style={styles.launchBtnSubtext}>Silhouette bounce + New!</Text>
        </Pressable>

        <Pressable
          style={[styles.launchBtn, styles.launchBtnOld, disabled && styles.btnDisabled]}
          onPress={() => launch(false)}
          disabled={disabled}
        >
          <Text style={styles.launchBtnText}>Old fusion</Text>
          <Text style={styles.launchBtnSubtext}>Quick reveal, no badge</Text>
        </Pressable>

        <Pressable
          style={[styles.launchBtn, styles.launchBtnVariant, disabled && styles.btnDisabled]}
          onPress={() => launch(false, SlimeVariant.GOLD)}
          disabled={disabled}
        >
          <Text style={styles.launchBtnText}>Variant fusion</Text>
          <Text style={styles.launchBtnSubtext}>Silhouette star tease + label</Text>
        </Pressable>
      </View>

      {session ? (
        <FusionRevealOverlay
          revealKey={revealKey}
          parentSpeciesAId={session.parentSpeciesAId}
          parentSpeciesBId={session.parentSpeciesBId}
          resultSpecies={session.resultSpecies}
          resultVariant={session.resultVariant}
          isNewSpecies={session.isNewSpecies}
          onDismiss={dismiss}
        />
      ) : null}
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
  hint: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    lineHeight: 15,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  launchBtn: {
    flexGrow: 1,
    flexBasis: 140,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  launchBtnNew: {
    backgroundColor: '#3d5a7a',
  },
  launchBtnOld: {
    backgroundColor: '#5a3d7a',
  },
  launchBtnVariant: {
    backgroundColor: '#7a623d',
  },
  launchBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  launchBtnSubtext: { color: 'rgba(255,255,255,0.72)', fontSize: 10, marginTop: 3, lineHeight: 13 },
  btnDisabled: { opacity: 0.55 },
});
