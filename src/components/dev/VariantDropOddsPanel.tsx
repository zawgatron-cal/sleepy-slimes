/**
 * Dev — current Prismatic / Exotic / Gold drop odds (base + active bonuses).
 */

import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SLIME_VARIANT_LABELS, SlimeVariant } from '@/src/constants/game';
import { getEquippedSlimeId, getSlimes, getSpecies } from '@/src/db';
import {
  resolveSleepRewardModifiers,
  variantDropBonusForModifiers,
} from '@/src/services/sleepRewards';
import { useEquippedSlimeStore } from '@/src/stores';
import { describeEquippedSlimeBonus } from '@/src/utils/equippedSlimeRewards';
import {
  formatVariantDropPct,
  getVariantDropPercentages,
} from '@/src/utils/slimeVariant';
import { createAppStyles } from '@/src/theme/createAppStyles';

const RARE_VARIANTS = [
  SlimeVariant.PRISMATIC,
  SlimeVariant.EXOTIC,
  SlimeVariant.GOLD,
] as const;

type OddsSnapshot = {
  base: Record<SlimeVariant, number>;
  current: Record<SlimeVariant, number>;
  buddyLabel: string;
  secretActive: boolean;
  streakValue: number;
};

export function VariantDropOddsPanel() {
  const equippedSlimeId = useEquippedSlimeStore((s) => s.equippedSlimeId);
  const [snapshot, setSnapshot] = useState<OddsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const modifiers = await resolveSleepRewardModifiers(Date.now());
      const bonus = variantDropBonusForModifiers(modifiers);
      const [equippedId, slimes, speciesList] = await Promise.all([
        getEquippedSlimeId(),
        getSlimes(),
        getSpecies(),
      ]);

      let buddyLabel = '(none equipped)';
      if (equippedId) {
        const slime = slimes.find((s) => s.id === equippedId);
        const species = slime
          ? speciesList.find((sp) => sp.id === slime.speciesId)
          : undefined;
        if (slime && species) {
          buddyLabel = `${species.name} L${slime.level} — ${describeEquippedSlimeBonus(species.tier, slime.level)}`;
        } else {
          buddyLabel = equippedId;
        }
      }

      setSnapshot({
        base: getVariantDropPercentages(),
        current: getVariantDropPercentages(bonus),
        buddyLabel,
        secretActive: modifiers.secretVariantBonus != null,
        streakValue: modifiers.streakValue,
      });
    } catch (e) {
      console.warn('VariantDropOddsPanel refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, equippedSlimeId]);

  return (
    <View style={styles.block}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Variant drop odds</Text>
        <Pressable style={styles.refreshBtn} onPress={() => void refresh()} disabled={loading}>
          <Text style={styles.refreshText}>{loading ? '…' : 'Refresh'}</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        Your effective rates per slime roll (sleep spawn + fusion). Standard fills the rest.
      </Text>

      {loading && !snapshot ? (
        <ActivityIndicator color="#9cf" style={styles.loader} />
      ) : snapshot ? (
        <>
          {RARE_VARIANTS.map((variant) => {
            const current = snapshot.current[variant];
            const base = snapshot.base[variant];
            const delta = current - base;
            return (
              <View key={variant} style={styles.oddsRow}>
                <Text style={styles.variantLabel}>{SLIME_VARIANT_LABELS[variant]}</Text>
                <Text style={styles.oddsValue}>{formatVariantDropPct(variant, current)}</Text>
                <Text style={styles.oddsBase}>
                  base {formatVariantDropPct(variant, base)}
                  {delta > 0.00005 ? ` (+${delta.toFixed(variant === SlimeVariant.GOLD ? 4 : variant === SlimeVariant.EXOTIC ? 3 : 2)}pp)` : ''}
                </Text>
              </View>
            );
          })}
          <Text style={styles.meta}>streak: {snapshot.streakValue}</Text>
          <Text style={styles.meta}>buddy: {snapshot.buddyLabel}</Text>
          <Text style={styles.meta}>
            secret bonus:{' '}
            {snapshot.secretActive ? 'active (+0.4% prism, +0.04% gold)' : 'inactive'}
          </Text>
        </>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9cf',
  },
  hint: { fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 17 },
  loader: { marginVertical: 8 },
  oddsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  variantLabel: {
    width: 88,
    fontSize: 13,
    fontWeight: '700',
    color: '#eee',
  },
  oddsValue: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: '#bfb',
    minWidth: 72,
  },
  oddsBase: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#777',
    flex: 1,
  },
  meta: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#888',
    marginTop: 8,
    lineHeight: 16,
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  refreshText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
