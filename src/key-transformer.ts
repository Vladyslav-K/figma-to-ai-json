export const KEY_MAP = {
  // Base properties
  type: 't',
  name: 'n',
  layout: 'l',
  gap: 'g',
  justify: 'j',
  align: 'al',
  wrap: 'wr',
  pos: 'ps',
  constraints: 'cn',
  opacity: 'o',
  radius: 'r',
  border: 'bd',
  shadow: 'sh',
  blur: 'bl',
  backdropBlur: 'bbl',
  blendMode: 'bm',
  rotate: 'rt',
  aspectRatio: 'ar',
  zIndex: 'z',
  order: 'ord',
  isFirst: 'iF',
  isLast: 'iL',
  responsive: 'rs',
  devInfo: 'di',
  visible: 'vs',
  overflow: 'of',
  semantic: 'sm',
  interactions: 'ia',
  patternInfo: 'pi',
  // Text
  content: 'c',
  font: 'f',
  size: 's',
  weight: 'wt',
  color: 'cl',
  lineH: 'lh',
  letterS: 'ls',
  textAlign: 'ta',
  textDecor: 'td',
  textTransform: 'tt',
  truncate: 'tr',
  paragraphSpacing: 'psp',
  autoResize: 'ars',
  richText: 'rT',
  // Image
  fit: 'ft',
  imageRef: 'iR',
  originalSize: 'oS',
  cropRect: 'cR',
  nodeId: 'nId',
} as const;

export type LongKey = keyof typeof KEY_MAP;
export type ShortKey = (typeof KEY_MAP)[LongKey];

export const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
) as Record<ShortKey, LongKey>;

export function transformToShortKeys<T extends object>(obj: T): object {
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? transformToShortKeys(item)
        : item
    );
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const shortKey = (KEY_MAP as Record<string, string>)[key] ?? key;

    if (typeof value === 'object' && value !== null) {
      result[shortKey] = transformToShortKeys(value as object);
    } else {
      result[shortKey] = value;
    }
  }

  return result;
}

export function transformToLongKeys<T extends object>(obj: T): object {
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? transformToLongKeys(item)
        : item
    );
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const longKey = (REVERSE_KEY_MAP as Record<string, string>)[key] ?? key;

    if (typeof value === 'object' && value !== null) {
      result[longKey] = transformToLongKeys(value as object);
    } else {
      result[longKey] = value;
    }
  }

  return result;
}
