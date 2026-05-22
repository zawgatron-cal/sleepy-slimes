import type { Slime, Species } from '@/src/types';

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
  'favorited',
  'favorite',
  'favourited',
  'favourite',
  'fav',
  'favs',
]);

/** Split query into favorite filter + remaining species/nickname terms. */
export function parseCollectionSearchQuery(query: string): {
  favoritesOnly: boolean;
  textQuery: string;
} {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) {
    return { favoritesOnly: false, textQuery: '' };
  }

  const textTokens: string[] = [];
  let favoritesOnly = false;
  for (const token of tokens) {
    if (COLLECTION_FAVORITE_SEARCH_KEYWORDS.has(token)) {
      favoritesOnly = true;
    } else {
      textTokens.push(token);
    }
  }

  return { favoritesOnly, textQuery: textTokens.join(' ') };
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
 * Keywords `favorited` / `favorite` / `fav` (any word in the query) restrict to favorited slimes only.
 */
export function slimeIsFavorited(slime: Slime): boolean {
  return slime.favorited === true;
}

export function matchesCollectionSlimeSearch(
  slime: Slime,
  species: Species | undefined | null,
  query: string
): boolean {
  if (!slime?.id) return false;

  const trimmed = typeof query === 'string' ? query.trim() : '';
  if (!trimmed) return true;

  const { favoritesOnly, textQuery } = parseCollectionSearchQuery(trimmed);
  if (favoritesOnly && !slimeIsFavorited(slime)) return false;
  if (!textQuery) return favoritesOnly ? slimeIsFavorited(slime) : true;

  return matchesCollectionTextSearch(slime, species, textQuery);
}
