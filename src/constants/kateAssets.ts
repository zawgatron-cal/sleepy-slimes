import type { ImageSourcePropType } from 'react-native';

/** Filenames keep `embarassed` as-shipped. */
export type KateExpression = 'happy' | 'embarassed' | 'neutral' | 'shocked' | 'elated';

export const KATE_EXPRESSION_ASSETS: Record<KateExpression, ImageSourcePropType> = {
  happy: require('../../assets/ui/kate-expressions/kate-happy.png'),
  embarassed: require('../../assets/ui/kate-expressions/kate-embarassed.png'),
  neutral: require('../../assets/ui/kate-expressions/kate-neutral.png'),
  shocked: require('../../assets/ui/kate-expressions/kate-shocked.png'),
  elated: require('../../assets/ui/kate-expressions/kate-elated.png'),
};

export const DEFAULT_KATE_EXPRESSION: KateExpression = 'neutral';
