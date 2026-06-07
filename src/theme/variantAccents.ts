import { SlimeVariant, type SlimeVariant as SlimeVariantType } from '@/src/constants/game';

export type VariantGradientStop = { offset: string; color: string };

export type VariantAccent = {
  stops: VariantGradientStop[];
};

const PRISMATIC: VariantAccent = {
  stops: [
    { offset: '0%', color: '#ff2a5c' },
    { offset: '25%', color: '#ffd500' },
    { offset: '50%', color: '#00cfff' },
    { offset: '75%', color: '#c73dff' },
    { offset: '100%', color: '#ff2a5c' },
  ],
};

const EXOTIC: VariantAccent = {
  stops: [
    { offset: '0%', color: '#FF3DFF' },
    { offset: '33%', color: '#00FFF0' },
    { offset: '66%', color: '#39FF14' },
    { offset: '100%', color: '#FF0099' },
  ],
};

const GOLD: VariantAccent = {
  stops: [
    { offset: '0%', color: '#F5D060' },
    { offset: '45%', color: '#EDBE40' },
    { offset: '100%', color: '#A87408' },
  ],
};

const BY_VARIANT: Partial<Record<SlimeVariantType, VariantAccent>> = {
  [SlimeVariant.PRISMATIC]: PRISMATIC,
  [SlimeVariant.EXOTIC]: EXOTIC,
  [SlimeVariant.GOLD]: GOLD,
};

export function resolveVariantAccent(variant: SlimeVariantType): VariantAccent | null {
  return BY_VARIANT[variant] ?? null;
}
