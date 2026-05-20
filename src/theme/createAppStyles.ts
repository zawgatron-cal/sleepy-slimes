/**
 * StyleSheet helper — RN Text no longer honors Text.defaultProps, so we attach Itim
 * to text-like style objects. Layout-only / image-only styles are left unchanged.
 */
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle | undefined | false>;

const LAYOUT_KEYS = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'flexDirection',
  'alignItems',
  'alignContent',
  'alignSelf',
  'justifyContent',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingHorizontal',
  'paddingVertical',
  'paddingStart',
  'paddingEnd',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'start',
  'end',
  'overflow',
  'zIndex',
  'opacity',
  'transform',
  'transformOrigin',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderWidth',
  'borderTopWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'borderColor',
  'borderTopColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRightColor',
  'backgroundColor',
  'gap',
  'rowGap',
  'columnGap',
  'aspectRatio',
  'shadowColor',
  'shadowOffset',
  'shadowOpacity',
  'shadowRadius',
  'elevation',
  'pointerEvents',
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isLayoutOnlyStyle(s: Record<string, unknown>): boolean {
  const keys = Object.keys(s);
  if (keys.length === 0) return true;
  return keys.every((k) => LAYOUT_KEYS.has(k));
}

function shouldAttachFont(s: Record<string, unknown>): boolean {
  if ('fontFamily' in s && s.fontFamily != null && s.fontFamily !== '') {
    return false;
  }
  if ('fontSize' in s || 'fontWeight' in s || 'fontStyle' in s) return true;
  if ('lineHeight' in s || 'letterSpacing' in s || 'textAlign' in s) return true;
  if ('textDecorationLine' in s || 'includeFontPadding' in s) return true;
  if ('color' in s && typeof s.color === 'string') return true;
  if (isLayoutOnlyStyle(s)) return false;
  return false;
}

/**
 * Like StyleSheet.create, but merges `fontFamily: Itim` into text-like entries.
 */
export function createAppStyles<T extends NamedStyles>(styles: T): T {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(styles)) {
    const s = styles[key as keyof T];
    if (!isPlainObject(s)) {
      out[key] = s;
      continue;
    }
    if (shouldAttachFont(s)) {
      out[key] = { ...s, fontFamily: APP_FONT_FAMILY };
    } else {
      out[key] = s;
    }
  }
  return StyleSheet.create(out as Record<string, ViewStyle | TextStyle | ImageStyle>) as T;
}
