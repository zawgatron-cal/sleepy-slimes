import type { Slime, Species } from '@/src/types';
import { DEFAULT_SLIME_VARIANT, SlimeVariant, Tier, type Tier as TierType } from '@/src/constants/game';

export const MAX_SLIME_NICKNAME_LENGTH = 32;

/** Fallback when species master row is missing (grass_slime → Grass Slime). */
export function formatSpeciesIdAsDisplayName(speciesId: string): string {
  return speciesId
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function getSpeciesDefaultDisplayName(
  species: Species | undefined | null,
  speciesId: string
): string {
  return species?.name ?? formatSpeciesIdAsDisplayName(speciesId);
}

/** Player-facing name: custom nickname, else species default (e.g. Grass Slime). */
export function getSlimeDisplayName(
  slime: Slime,
  species?: Species | null
): string {
  const custom = slime.nickname?.trim();
  if (custom) return custom;
  return getSpeciesDefaultDisplayName(species, slime.speciesId);
}

export function normalizeSlimeNickname(
  raw: string,
  defaultName: string
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const capped =
    trimmed.length > MAX_SLIME_NICKNAME_LENGTH
      ? trimmed.slice(0, MAX_SLIME_NICKNAME_LENGTH)
      : trimmed;
  if (capped === defaultName) return null;
  return capped;
}

export function slimeHasCustomNickname(slime: Slime, species?: Species | null): boolean {
  const custom = slime.nickname?.trim();
  if (!custom) return false;
  return custom !== getSpeciesDefaultDisplayName(species, slime.speciesId);
}

const COLLECTION_FAVORITE_SEARCH_KEYWORDS = new Set([
  '*',
  'favorited',
  'favorite',
  'favourited',
  'favourite',
  'fav',
  'favs',
]);

const COLLECTION_VARIANT_SEARCH_KEYWORDS: Record<string, SlimeVariant> = {
  prismatic: SlimeVariant.PRISMATIC,
  exotic: SlimeVariant.EXOTIC,
  gold: SlimeVariant.GOLD,
};

const COLLECTION_TIER_SEARCH_KEYWORDS: Record<string, TierType> = {
  common: Tier.COMMON,
  uncommon: Tier.UNCOMMON,
  rare: Tier.RARE,
  'ultra rare': Tier.ULTRA_RARE,
  ultrarare: Tier.ULTRA_RARE,
  'ultra-rare': Tier.ULTRA_RARE,
  ultra: Tier.ULTRA_RARE,
  ur: Tier.ULTRA_RARE,
  legendary: Tier.LEGENDARY,
  leg: Tier.LEGENDARY,
};

/** Split query into favorite / variant / tier filters + remaining species/nickname terms. */
export function parseCollectionSearchQuery(query: string): {
  favoritesOnly: boolean;
  variantFilter: SlimeVariant | null;
  tierFilter: TierType | null;
  textQuery: string;
} {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) {
    return { favoritesOnly: false, variantFilter: null, tierFilter: null, textQuery: '' };
  }

  const textTokens: string[] = [];
  let favoritesOnly = false;
  let variantFilter: SlimeVariant | null = null;
  let tierFilter: TierType | null = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const twoWord =
      i + 1 < tokens.length ? `${token} ${tokens[i + 1]}` : null;

    if (COLLECTION_FAVORITE_SEARCH_KEYWORDS.has(token)) {
      favoritesOnly = true;
      continue;
    }
    if (twoWord && COLLECTION_TIER_SEARCH_KEYWORDS[twoWord]) {
      tierFilter = COLLECTION_TIER_SEARCH_KEYWORDS[twoWord];
      i += 1;
      continue;
    }
    if (COLLECTION_VARIANT_SEARCH_KEYWORDS[token]) {
      variantFilter = COLLECTION_VARIANT_SEARCH_KEYWORDS[token];
      continue;
    }
    if (COLLECTION_TIER_SEARCH_KEYWORDS[token]) {
      tierFilter = COLLECTION_TIER_SEARCH_KEYWORDS[token];
      continue;
    }
    textTokens.push(token);
  }

  return { favoritesOnly, variantFilter, tierFilter, textQuery: textTokens.join(' ') };
}

function matchesCollectionTextSearch(
  slime: Slime,
  species: Species | undefined | null,
  textQuery: string
): boolean {
  const q = textQuery.trim().toLowerCase();
  if (!q) return true;

  const speciesLabel = getSpeciesDefaultDisplayName(species, slime.speciesId).toLowerCase();
  if (speciesLabel.includes(q)) return true;

  const nickname = slime.nickname?.trim();
  if (nickname && nickname.toLowerCase().includes(q)) return true;

  return false;
}

/**
 * Collection search: species name first, then nickname.
 * Keywords: `*` / `favorite` / `fav` → favorited only;
 * `prismatic` / `exotic` / `gold` → variant filter;
 * `common` / `uncommon` / `rare` / `ultra rare` / `legendary` → tier filter.
 */
export function slimeIsFavorited(slime: Slime): boolean {
  return slime.favorited === true;
}

function slimeMatchesVariantFilter(slime: Slime, variantFilter: SlimeVariant): boolean {
  const variant = slime.variant ?? DEFAULT_SLIME_VARIANT;
  return variant === variantFilter;
}

function slimeMatchesTierFilter(
  species: Species | undefined | null,
  tierFilter: TierType
): boolean {
  return species?.tier === tierFilter;
}

export function matchesCollectionSlimeSearch(
  slime: Slime,
  species: Species | undefined | null,
  query: string
): boolean {
  if (!slime?.id) return false;

  const trimmed = typeof query === 'string' ? query.trim() : '';
  if (!trimmed) return true;

  const { favoritesOnly, variantFilter, tierFilter, textQuery } =
    parseCollectionSearchQuery(trimmed);
  if (favoritesOnly && !slimeIsFavorited(slime)) return false;
  if (variantFilter != null && !slimeMatchesVariantFilter(slime, variantFilter)) return false;
  if (tierFilter != null && !slimeMatchesTierFilter(species, tierFilter)) return false;
  if (!textQuery) return true;

  return matchesCollectionTextSearch(slime, species, textQuery);
}
