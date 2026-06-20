/**
 * Gates variant foil animations so off-screen collection grids don't animate on other tabs.
 */

import { create } from 'zustand';

export type FoilMotion = 'full' | 'static' | 'off';

interface FoilAnimationStore {
  isCollectionFocused: boolean;
  setCollectionFocused: (focused: boolean) => void;
}

export const useFoilAnimationStore = create<FoilAnimationStore>((set) => ({
  isCollectionFocused: false,
  setCollectionFocused: (isCollectionFocused) => set({ isCollectionFocused }),
}));

/** Collection grid: full foil on the collection tab; static sheen while other tabs stay mounted. */
export function collectionGridFoilMotion(isFocused: boolean): FoilMotion {
  return isFocused ? 'full' : 'static';
}
