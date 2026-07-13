export type CollectionSearchGuideGroup = {
  label: string;
  keywords: string;
};

/** Compact search keyword reference for the collection screen. */
export const COLLECTION_SEARCH_GUIDE_GROUPS: CollectionSearchGuideGroup[] = [
  { label: 'Name', keywords: 'species or nickname' },
  { label: 'Favorites', keywords: '*, favorite, fav' },
  { label: 'Variant', keywords: 'prismatic, exotic, gold' },
  { label: 'Tier', keywords: 'common, uncommon, rare, ultra rare, legendary' },
];

export const COLLECTION_SEARCH_GUIDE_EXAMPLE = '* rare grass';
