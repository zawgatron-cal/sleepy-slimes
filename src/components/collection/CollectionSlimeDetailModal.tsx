/**
 * Collection — owned slime detail (level, buddy effect, equip).
 */

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import {
  SLIME_VARIANT_LABELS,
  TIER_LABELS,
  getSlimeConvertCandyValue,
  type SlimeLevel,
  type SlimeVariant,
} from '@/src/constants/game';
import type { Species, Tier } from '@/src/types';
import { CollectionDetailCandyPill, CollectionDetailConvertPill, COLLECTION_DETAIL_TOP_PILL_OFFSET } from '@/src/components/collection/CollectionDetailCandyPill';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { SlimeConvertConfirmModal } from '@/src/components/collection/SlimeConvertConfirmModal';
import { FitText } from '@/src/components/FitText';
import { FavoriteStarIcon } from '@/src/components/collection/FavoriteStarIcon';
import { SlimeRenameModal } from '@/src/components/collection/SlimeRenameModal';
import {
  TutorialNpcDialoguePanel,
  type TutorialDialogueMessage,
} from '@/src/components/tutorial/TutorialNpcDialogue';
import { applySlimeNickname, resetSlimeNickname } from '@/src/services/slimeNaming';
import { toggleSlimeFavorite } from '@/src/services/slimeFavorite';
import { SlimeArtwork } from '@/src/components/SlimeArtwork';
import { useAnimationSettingsStore } from '@/src/stores/useAnimationSettingsStore';
import {
  getSlimeDisplayName,
  getSpeciesDefaultDisplayName,
} from '@/src/utils/slimeDisplayName';
import { describeEquippedSlimeBonus } from '@/src/utils/equippedSlimeRewards';
import { evaluateSlimeLevelUp, getLevelUpRequirement } from '@/src/utils/slimeLevelUp';
import { parseSlimeLevel } from '@/src/utils/slimeLevel';
import { resolveTierAccent } from '@/src/theme/tierAccents';
import { resolveVariantAccent } from '@/src/theme/variantAccents';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';
import { playUiSuccess } from '@/src/services/soundEffects';

const t = mainScreens.collection.detailModal;

const META_TIER_SVG_H = 22;
const META_TIER_FONT = 17;
const META_TIER_BASELINE = 17;

function DetailTierGradientLabel({ tier, label }: { tier: Tier; label: string }) {
  const [width, setWidth] = useState(0);
  const tierAccent = resolveTierAccent(tier);
  const gradId = `detail-tier-${useId().replace(/:/g, '')}`;

  return (
    <View style={styles.tierGradientWrap}>
      <Text
        style={styles.tierMeasure}
        onLayout={(e) => {
          const w = Math.ceil(e.nativeEvent.layout.width);
          if (w > 0) setWidth((prev) => (prev === w ? prev : w));
        }}
      >
        {label}
      </Text>
      {width > 0 ? (
        <Svg width={width} height={META_TIER_SVG_H} viewBox={`0 0 ${width} ${META_TIER_SVG_H}`}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={tierAccent.borderTop} />
              <Stop offset="100%" stopColor={tierAccent.borderBottom} />
            </LinearGradient>
          </Defs>
          <SvgText
            x={0}
            y={META_TIER_BASELINE}
            textAnchor="start"
            fontFamily={APP_FONT_FAMILY}
            fontSize={META_TIER_FONT}
            fontWeight="800"
            fill={`url(#${gradId})`}
          >
            {label}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}

function DetailVariantGradientLabel({
  variant,
  label,
}: {
  variant: SlimeVariant;
  label: string;
}) {
  const accent = resolveVariantAccent(variant);
  const [width, setWidth] = useState(0);
  const gradId = `detail-variant-${useId().replace(/:/g, '')}`;

  if (!accent) {
    return (
      <Text style={styles.variant} numberOfLines={1}>
        {label}
      </Text>
    );
  }

  return (
    <View style={styles.tierGradientWrap}>
      <Text
        style={styles.tierMeasure}
        onLayout={(e) => {
          const w = Math.ceil(e.nativeEvent.layout.width);
          if (w > 0) setWidth((prev) => (prev === w ? prev : w));
        }}
      >
        {label}
      </Text>
      {width > 0 ? (
        <Svg width={width} height={META_TIER_SVG_H} viewBox={`0 0 ${width} ${META_TIER_SVG_H}`}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              {accent.stops.map((stop) => (
                <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </LinearGradient>
          </Defs>
          <SvgText
            x={0}
            y={META_TIER_BASELINE}
            textAnchor="start"
            fontFamily={APP_FONT_FAMILY}
            fontSize={META_TIER_FONT}
            fontWeight="800"
            fill={`url(#${gradId})`}
          >
            {label}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}

export type CollectionSlimeDetail = {
  id: string;
  speciesId: string;
  variant: SlimeVariant;
  level: SlimeLevel;
  equippedNights: number;
  nickname?: string;
  favorited?: boolean;
  acquiredAt: number;
  species?: Species;
};

export type CollectionSlimeDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  slime: CollectionSlimeDetail;
  isEquipped: boolean;
  candyBalance: number;
  onEquip: () => void;
  onUnequip: () => void;
  onLevelUp?: () => void | Promise<void>;
  onConvert?: () => void | Promise<void>;
  /** Hide convert, favorite, rename, and level-up while tutorial onboarding runs. */
  learningLocked?: boolean;
  /** Cate dialogue overlay rendered inside this modal (buddy tutorial). */
  tutorialDialogue?: {
    visible: boolean;
    message: TutorialDialogueMessage;
    onDismiss: () => void;
  };
};

function formatAcquiredDate(ms: number): string {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function formatEquippedNightsProgress(equipped: number, required: number): string {
  const nightWord = required === 1 ? 'night' : 'nights';
  return `${equipped}/${required} ${nightWord} equipped`;
}

/** Percent values first (`+3%`, `5%`); then other numbers (`+1` in "+1 slime roll"). */
const BUDDY_EFFECT_NUMERIC_SPLIT = /(\+?\d+(?:\.\d+)?%|\+?\d+(?:\.\d+)?)/;
const BUDDY_EFFECT_NUMERIC_PART = /^\+?\d+(?:\.\d+)?%?$/;

/** Renders buddy effect copy with numeric values in blue accent. */
function BuddyEffectText({ description }: { description: string }) {
  const parts = description.split(BUDDY_EFFECT_NUMERIC_SPLIT);

  return (
    <Text style={styles.buddyEffect}>
      Buddy Effect:{' '}
      {parts
        .filter((part) => part.length > 0)
        .map((part, i) =>
          BUDDY_EFFECT_NUMERIC_PART.test(part) ? (
            <Text key={i} style={styles.buddyEffectNumber}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
    </Text>
  );
}

export function CollectionSlimeDetailModal({
  visible,
  onClose,
  slime,
  isEquipped,
  candyBalance,
  onEquip,
  onUnequip,
  onLevelUp,
  onConvert,
  learningLocked = false,
  tutorialDialogue,
}: CollectionSlimeDetailModalProps) {
  const overlayAnimationsEnabled = useAnimationSettingsStore((s) => s.overlayAnimationsEnabled);
  const [renameVisible, setRenameVisible] = useState(false);
  const [convertVisible, setConvertVisible] = useState(false);
  const [favorited, setFavorited] = useState(!!slime.favorited);

  useEffect(() => {
    if (visible) {
      setFavorited(!!slime.favorited);
    } else {
      setRenameVisible(false);
      setConvertVisible(false);
    }
  }, [visible, slime.favorited]);

  const defaultName = getSpeciesDefaultDisplayName(slime.species, slime.speciesId);
  const displayName = getSlimeDisplayName(slime, slime.species);
  const tier = slime.species?.tier;
  const tierLabel = tier != null ? TIER_LABELS[tier] : '—';
  const variantLabel = SLIME_VARIANT_LABELS[slime.variant];
  const level = parseSlimeLevel(slime.level);

  const levelStatus = useMemo(() => {
    if (tier == null) return null;
    return evaluateSlimeLevelUp(
      { ...slime, level },
      tier,
      candyBalance
    );
  }, [slime, tier, candyBalance, level]);

  const progressLabel = levelStatus?.atMaxLevel
    ? 'Max level'
    : levelStatus?.requirement
      ? formatEquippedNightsProgress(
          levelStatus.equippedNights,
          levelStatus.nightsRequired
        )
      : '—';

  const progressRatio = levelStatus?.atMaxLevel
    ? 1
    : levelStatus?.requirement && levelStatus.nightsRequired > 0
      ? Math.min(1, levelStatus.equippedNights / levelStatus.nightsRequired)
      : 0;

  const nightsRequired = levelStatus?.nightsRequired ?? 0;
  const progressDividerCount =
    !levelStatus?.atMaxLevel && nightsRequired > 1 ? nightsRequired - 1 : 0;

  const buddyEffect =
    tier != null ? describeEquippedSlimeBonus(tier, level) : '—';

  const levelUpCost = tier != null ? getLevelUpRequirement(tier, level)?.candies : undefined;
  const convertCandyReward = tier != null ? getSlimeConvertCandyValue(tier) : null;
  const canConvert = !learningLocked && convertCandyReward != null && onConvert != null;

  const openRename = useCallback(() => setRenameVisible(true), []);

  const handleSaveNickname = useCallback(
    async (raw: string) => {
      await applySlimeNickname(slime.id, slime.species, slime.speciesId, raw);
      setRenameVisible(false);
    },
    [slime.id, slime.species, slime.speciesId]
  );

  const handleResetNickname = useCallback(async () => {
    await resetSlimeNickname(slime.id);
    setRenameVisible(false);
  }, [slime.id]);

  const handleToggleFavorite = useCallback(async () => {
    const next = await toggleSlimeFavorite(slime.id);
    if (next != null) setFavorited(next);
  }, [slime.id]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={overlayAnimationsEnabled ? 'fade' : 'none'}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
          <View style={styles.cardWrapInner}>
          {canConvert ? (
            <CollectionDetailConvertPill
              style={styles.convertCorner}
              accessibilityLabel={`Convert ${displayName} to ${convertCandyReward} candies`}
              onPress={() => setConvertVisible(true)}
            />
          ) : null}
          <CollectionDetailCandyPill count={candyBalance} style={styles.candyBadge} />
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerCardOuter}>
              <View style={styles.headerCard}>
              <SlimeArtwork
                speciesId={slime.speciesId}
                variant={slime.variant}
                style={styles.avatarWrap}
                imageStyle={styles.avatar}
                resizeMode="contain"
              />
              <View style={styles.headerTextCol}>
                <View style={styles.nameRow}>
                  <FitText
                    text={displayName}
                    preset="collectionDetailSlimeName"
                    style={styles.name}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    adjustsFontSizeToFit
                    minimumFontScale={0.55}
                  />
                  {!learningLocked ? (
                    <Pressable
                      style={styles.editBtn}
                      accessibilityLabel="Rename slime"
                      hitSlop={8}
                      onPress={openRename}
                    >
                      <Text style={styles.editIcon}>✎</Text>
                    </Pressable>
                  ) : null}
                </View>
                <View style={styles.metaRow}>
                  {tier != null ? (
                    <DetailTierGradientLabel tier={tier} label={tierLabel} />
                  ) : (
                    <Text style={styles.rarityFallback}>—</Text>
                  )}
                  <Text style={styles.raritySep}> | </Text>
                  <DetailVariantGradientLabel variant={slime.variant} label={variantLabel} />
                </View>
                <Text style={styles.acquired} numberOfLines={1} ellipsizeMode="tail">
                  Acquired: {formatAcquiredDate(slime.acquiredAt)}
                </Text>
              </View>
              </View>
              {!learningLocked ? (
                <Pressable
                  style={styles.favoriteCorner}
                  onPress={() => void handleToggleFavorite()}
                  accessibilityRole="button"
                  accessibilityLabel={favorited ? 'Remove favorite' : 'Add favorite'}
                  hitSlop={10}
                >
                  <FavoriteStarIcon size={32} active={favorited} />
                </Pressable>
              ) : null}
            </View>

            {/* Level + progress */}
            <Text style={styles.levelLabel}>Level {level}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressRatio * 100}%` },
                  progressRatio >= 1 && styles.progressFillComplete,
                ]}
              />
              {Array.from({ length: progressDividerCount }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDivider,
                    { left: `${((i + 1) / nightsRequired) * 100}%` },
                  ]}
                />
              ))}
              <Text style={styles.progressText}>{progressLabel}</Text>
            </View>

            {!learningLocked && !levelStatus?.atMaxLevel && levelUpCost != null ? (
              <Pressable
                style={[
                  styles.levelUpBtn,
                  !levelStatus?.canLevelUp && styles.levelUpBtnDisabled,
                ]}
                disabled={!levelStatus?.canLevelUp || !onLevelUp}
                onPress={() => {
                  playUiSuccess();
                  void onLevelUp?.();
                }}
              >
                <Text style={styles.levelUpBtnText}>Level Up: {levelUpCost}</Text>
                <CandyGlyph size={18} />
              </Pressable>
            ) : null}

            <BuddyEffectText description={buddyEffect} />

            {/* Equip */}
            <Pressable
              style={[styles.equipBtn, isEquipped && styles.equipBtnActive]}
              onPress={() => {
                playUiSuccess();
                if (isEquipped) onUnequip();
                else onEquip();
              }}
            >
              <Text style={styles.equipBtnText}>{isEquipped ? 'Equipped' : 'Equip'}</Text>
            </Pressable>
          </View>
          </View>
        </Pressable>
      </Pressable>

        {tutorialDialogue ? (
          <TutorialNpcDialoguePanel
            embedded
            visible={tutorialDialogue.visible}
            message={tutorialDialogue.message}
            onDismiss={tutorialDialogue.onDismiss}
          />
        ) : null}
      </View>

      <SlimeRenameModal
        visible={renameVisible}
        initialValue={displayName}
        defaultName={defaultName}
        onClose={() => setRenameVisible(false)}
        onSave={(raw) => void handleSaveNickname(raw)}
        onReset={() => void handleResetNickname()}
      />

      {canConvert && convertCandyReward != null ? (
        <SlimeConvertConfirmModal
          visible={convertVisible}
          slimeName={displayName}
          tierLabel={tierLabel}
          candyReward={convertCandyReward}
          isEquipped={isEquipped}
          onClose={() => setConvertVisible(false)}
          onConfirm={async () => {
            setConvertVisible(false);
            await onConvert?.();
          }}
        />
      ) : null}
    </Modal>
  );
}

const styles = createAppStyles({
  modalRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: t.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 340,
    overflow: 'visible',
    paddingTop: 28,
  },
  cardWrapInner: {
    width: '100%',
    position: 'relative',
  },
  candyBadge: {
    position: 'absolute',
    top: COLLECTION_DETAIL_TOP_PILL_OFFSET,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
  convertCorner: {
    position: 'absolute',
    top: COLLECTION_DETAIL_TOP_PILL_OFFSET,
    left: 0,
    zIndex: 21,
    elevation: 21,
  },
  card: {
    width: '100%',
    backgroundColor: t.bg,
    borderRadius: 14,
    borderWidth: 9,
    borderColor: t.border,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 20,
    overflow: 'visible',
    marginTop: 14,
  },
  /** Wraps header + corner star so the star can sit on the border edge. */
  headerCardOuter: {
    position: 'relative',
    marginBottom: 4,
    marginTop: 6,
    marginRight: 6,
    overflow: 'visible',
    zIndex: 2,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.surface,
    borderRadius: 16,
    paddingVertical: 0,
    paddingLeft: 4,
    paddingRight: 10,
    gap: 2,
    overflow: 'visible',
  },
  /** Half-outside top-right corner, overlapping the header panel edge. */
  favoriteCorner: {
    position: 'absolute',
    top: -14,
    right: -14,
    zIndex: 10,
    elevation: 10,
  },
  avatarWrap: { width: 108, height: 108, margin: 0, borderRadius: 12 },
  avatar: { width: 108, height: 108, margin: 0 },
  headerTextCol: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 2,
    marginBottom: -2,
  },
  name: {
    flexShrink: 1,
    fontFamily: APP_FONT_FAMILY,
    fontWeight: '800',
    color: t.accent,
    includeFontPadding: false,
  },
  editBtn: { flexShrink: 0, paddingLeft: 4, paddingVertical: 0 },
  editIcon: {
    fontSize: 21,
    color: t.accent,
    fontWeight: '700',
    transform: [{ scaleX: -1 }],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    maxWidth: '100%',
  },
  tierGradientWrap: {
    height: META_TIER_SVG_H,
    justifyContent: 'center',
  },
  tierMeasure: {
    position: 'absolute',
    opacity: 0,
    fontFamily: APP_FONT_FAMILY,
    fontSize: META_TIER_FONT,
    fontWeight: '800',
  },
  rarityFallback: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: META_TIER_FONT,
    fontWeight: '700',
    color: t.accent,
  },
  raritySep: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: t.variantText,
  },
  variant: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 17,
    fontWeight: '700',
    color: t.variantText,
  },
  acquired: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 15,
    fontWeight: '600',
    color: t.accent,
  },
  levelLabel: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 20,
    fontWeight: '800',
    color: t.accent,
    marginLeft: 8,
    marginBottom: 2,
  },
  progressTrack: {
    height: 26,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: t.accent,
    backgroundColor: t.progressTrack,
    overflow: 'hidden',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  /** Rounded on the left only; flat trailing edge matches rectangular night markers. */
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: t.surface,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 0,
  },
  progressFillComplete: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  progressDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: t.progressDivider,
    zIndex: 1,
  },
  progressText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: t.accent,
    textAlign: 'center',
    zIndex: 2,
    paddingHorizontal: 6,
  },
  levelUpBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: t.accent,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  levelUpBtnDisabled: { opacity: 0.45 },
  levelUpBtnText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: t.levelUpText,
  },
  buddyEffect: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: t.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  buddyEffectNumber: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    color: t.buddyEffectNumber,
  },
  equipBtn: {
    alignSelf: 'center',
    minWidth: 160,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: t.accent,
    backgroundColor: t.surface,
    alignItems: 'center',
  },
  equipBtnActive: {
    backgroundColor: t.surface,
  },
  equipBtnText: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 32,
    fontWeight: '800',
    color: t.accent,
  },
});
