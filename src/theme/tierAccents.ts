import { Tier } from '@/src/constants/game';
import type { Tier as TierValue } from '@/src/constants/game';
import { mainScreens } from '@/src/theme/mainScreensTheme';

export type TierGradient = { top: string; bottom: string };

/** @deprecated Prefer `TierGradient` — same shape, used by card border SVGs. */
export type TierAccent = { borderTop: string; borderBottom: string };

type TierPalette = {
  /** Flat text / icons / single-hue fills. */
  solid: string;
  /** Single-stop hue for soft vertical washes (e.g. fusion result icon). */
  gradient: string;
  /** Vertical gradient — lighter stop. */
  top: string;
  /** Vertical gradient — darker stop. */
  bottom: string;
};

const DEFAULT_SOLID = mainScreens.fuse.primaryText;
const DEFAULT_GRADIENT = '#F4B351';

const PALETTE: Record<TierValue, TierPalette> = {
  [Tier.COMMON]: {
    solid: '#2EC968',
    gradient: '#2EC968',
    top: '#5AD547',
    bottom: '#16A069',
  },
  [Tier.UNCOMMON]: {
    solid: '#ED9424',
    gradient: '#ED9424',
    top: '#FFB14A',
    bottom: '#D92C2C',
  },
  [Tier.RARE]: {
    solid: '#3F8DFF',
    gradient: '#3F8DFF',
    top: '#5CDADD',
    bottom: '#1412DB',
  },
  [Tier.ULTRA_RARE]: {
    solid: '#A15DFF',
    gradient: '#A15DFF',
    top: '#F550EA',
    bottom: '#5E29A9',
  },
  [Tier.LEGENDARY]: {
    solid: '#FFB800',
    gradient: '#FFB800',
    top: '#FFE566',
    bottom: '#E85D04',
  },
};

function paletteFor(tier?: TierValue): TierPalette | null {
  if (tier == null || !(tier in PALETTE)) return null;
  return PALETTE[tier as TierValue];
}

/** Solid tier color (no gradient) — labels, stars, picker text, etc. */
export function resolveTierColor(tier?: TierValue, fallback = DEFAULT_SOLID): string {
  return paletteFor(tier)?.solid ?? fallback;
}

/** Single hue for soft fills that use one gradient stop (e.g. fusion modal icon wash). */
export function resolveTierGradientColor(
  tier?: TierValue,
  fallback = DEFAULT_GRADIENT,
): string {
  return paletteFor(tier)?.gradient ?? fallback;
}

/** Two-stop vertical tier gradient — borders, gradient text, SVG accents. */
export function resolveTierGradient(tier?: TierValue): TierGradient {
  const p = paletteFor(tier);
  if (!p) {
    return { top: DEFAULT_GRADIENT, bottom: DEFAULT_GRADIENT };
  }
  return { top: p.top, bottom: p.bottom };
}

/** Card borders and collection tier pills (legacy `borderTop` / `borderBottom` names). */
export function resolveTierAccent(tier?: TierValue): TierAccent {
  const { top, bottom } = resolveTierGradient(tier);
  return { borderTop: top, borderBottom: bottom };
}

/** Map tier label copy (`"common"`, `"ultra rare"`, …) to palette gradient. */
export function resolveTierGradientFromLabel(tierLabel: string): TierGradient {
  const s = tierLabel.toLowerCase();
  if (s.includes('legendary')) return resolveTierGradient(Tier.LEGENDARY);
  if (s.includes('ultra')) return resolveTierGradient(Tier.ULTRA_RARE);
  if (s.includes('uncommon')) return resolveTierGradient(Tier.UNCOMMON);
  if (s.includes('rare')) return resolveTierGradient(Tier.RARE);
  if (s.includes('common')) return resolveTierGradient(Tier.COMMON);
  return resolveTierGradient(Tier.COMMON);
}
