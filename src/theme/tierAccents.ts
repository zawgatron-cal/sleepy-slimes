import type { Tier } from '@/src/types';
import { mainScreens } from '@/src/theme/mainScreensTheme';

export type TierAccent = { borderTop: string; borderBottom: string };

/** Vertical gradient stops for collection / slimepedia card borders. */
export function resolveTierAccent(tier?: Tier): TierAccent {
  switch (tier) {
    case 1:
      return {
        borderTop: '#5AD547',
        borderBottom: '#16A069',
      };
    case 2:
      return {
        borderTop: '#FFB14A',
        borderBottom: '#D92C2C',
      };
    case 3:
      return {
        borderTop: '#5CDADD',
        borderBottom: '#1412DB',
      };
    case 4:
      return {
        borderTop: '#F550EA',
        borderBottom: '#5E29A9',
      };
    default:
      return {
        borderTop: mainScreens.idle.specialTextBorder,
        borderBottom: mainScreens.idle.borderOne,
      };
  }
}
