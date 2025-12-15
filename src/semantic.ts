import type { SemanticRole, ComponentState } from './types';
import type { RawNodeData } from './parser';

const ROLE_PATTERNS: Record<SemanticRole, RegExp> = {
  button: /btn|button|cta|submit|action/i,
  input: /input|field|textbox|search|textarea/i,
  card: /card|tile|item|product/i,
  nav: /nav|navigation|menu|sidebar|breadcrumb/i,
  header: /header|topbar|appbar|toolbar/i,
  footer: /footer|bottom.?bar/i,
  modal: /modal|dialog|popup|overlay|drawer|sheet/i,
  badge: /badge|tag|chip|label|pill/i,
  avatar: /avatar|profile.?(img|image|pic)|user.?(img|image)/i,
  icon: /icon|ico|svg|glyph/i,
  link: /link|anchor|href/i,
  list: /list|grid|collection|items/i,
  listItem: /list.?item|row|cell/i,
  tab: /tab|segment/i,
  menu: /menu|dropdown.?menu|context.?menu/i,
  tooltip: /tooltip|hint|popover/i,
  dropdown: /dropdown|select|combobox|picker/i,
};

const STATE_PATTERNS: Record<ComponentState, RegExp> = {
  default: /default|normal|rest/i,
  hover: /hover|hovered|over/i,
  active: /active|pressed|down/i,
  disabled: /disabled|inactive|unavailable/i,
  focus: /focus|focused/i,
  selected: /selected|checked|on/i,
  loading: /loading|spinner|skeleton/i,
};

export function detectSemanticRole(name: string): SemanticRole | undefined {
  for (const [role, pattern] of Object.entries(ROLE_PATTERNS)) {
    if (pattern.test(name)) {
      return role as SemanticRole;
    }
  }
  return undefined;
}

export function detectComponentState(name: string): ComponentState | undefined {
  for (const [state, pattern] of Object.entries(STATE_PATTERNS)) {
    if (pattern.test(name)) {
      return state as ComponentState;
    }
  }
  return undefined;
}

export function isLikelyButton(raw: RawNodeData): boolean {
  const hasBackground =
    raw.fills &&
    raw.fills.some(
      (f) =>
        f.visible !== false &&
        (f.type === 'SOLID' || f.type?.startsWith('GRADIENT'))
    );
  const hasRadius =
    (raw.cornerRadius && raw.cornerRadius > 0) ||
    (raw.topLeftRadius && raw.topLeftRadius > 0);
  const hasText = raw.children?.some((c) => c.type === 'TEXT');
  const isAutoLayout = raw.layoutMode && raw.layoutMode !== 'NONE';
  const isSingleTextChild =
    raw.children?.length === 1 && raw.children[0].type === 'TEXT';

  return !!(
    hasBackground &&
    hasRadius &&
    (hasText || isSingleTextChild) &&
    isAutoLayout
  );
}

export function isLikelyInput(raw: RawNodeData): boolean {
  const hasBorder = raw.strokes && raw.strokes.length > 0 && raw.strokeWeight;
  const hasRadius =
    (raw.cornerRadius && raw.cornerRadius > 0) ||
    (raw.topLeftRadius && raw.topLeftRadius > 0);
  const hasPlaceholderText = raw.children?.some(
    (c) =>
      c.type === 'TEXT' &&
      (c.name?.toLowerCase().includes('placeholder') ||
        c.name?.toLowerCase().includes('label') ||
        (c.fills && c.fills.some((f) => f.opacity && f.opacity < 0.7)))
  );

  return !!(hasBorder && hasRadius && hasPlaceholderText);
}

export function isLikelyCard(raw: RawNodeData): boolean {
  const hasBackground =
    raw.fills &&
    raw.fills.some((f) => f.visible !== false && f.type === 'SOLID');
  const hasShadow =
    raw.effects &&
    raw.effects.some((e) => e.type === 'DROP_SHADOW' && e.visible !== false);
  const hasMultipleChildren = raw.children && raw.children.length > 1;
  const hasRadius = raw.cornerRadius && raw.cornerRadius > 0;

  return !!(hasBackground && (hasShadow || hasRadius) && hasMultipleChildren);
}

export function isLikelyIcon(raw: RawNodeData): boolean {
  const isVector =
    raw.type === 'VECTOR' ||
    raw.type === 'BOOLEAN_OPERATION' ||
    raw.type === 'LINE' ||
    raw.type === 'POLYGON' ||
    raw.type === 'STAR';
  const isSmall = raw.width <= 48 && raw.height <= 48;
  const isSquareish = Math.abs(raw.width - raw.height) <= 8;
  const hasOnlyVectorChildren =
    raw.children &&
    raw.children.every(
      (c) => c.type === 'VECTOR' || c.type === 'BOOLEAN_OPERATION'
    );

  return isVector || !!(isSmall && isSquareish && hasOnlyVectorChildren);
}

export function isLikelyAvatar(raw: RawNodeData): boolean {
  const hasImageFill = raw.fills?.some((f) => f.type === 'IMAGE');
  const isCircular =
    raw.type === 'ELLIPSE' ||
    (raw.cornerRadius && raw.width && raw.cornerRadius >= raw.width / 2);
  const isSmallSquare =
    raw.width <= 120 &&
    raw.height <= 120 &&
    Math.abs(raw.width - raw.height) <= 4;

  return !!((hasImageFill || isCircular) && isSmallSquare);
}

export function detectInteractive(
  raw: RawNodeData,
  role?: SemanticRole
): boolean {
  const interactiveRoles: SemanticRole[] = [
    'button',
    'input',
    'link',
    'tab',
    'menu',
    'dropdown',
    'listItem',
  ];

  if (role && interactiveRoles.includes(role)) {
    return true;
  }

  const nameIndicatesInteractive = /click|tap|press|toggle|switch/i.test(
    raw.name
  );

  return nameIndicatesInteractive;
}

export interface SemanticAnalysis {
  role?: SemanticRole;
  interactive?: boolean;
  state?: ComponentState;
}

export function analyzeSemantics(
  raw: RawNodeData
): SemanticAnalysis | undefined {
  let role = detectSemanticRole(raw.name);

  if (!role) {
    if (isLikelyButton(raw)) role = 'button';
    else if (isLikelyInput(raw)) role = 'input';
    else if (isLikelyCard(raw)) role = 'card';
    else if (isLikelyIcon(raw)) role = 'icon';
    else if (isLikelyAvatar(raw)) role = 'avatar';
  }

  const state = detectComponentState(raw.name);
  const interactive = detectInteractive(raw, role);

  if (!role && !state && !interactive) {
    return undefined;
  }

  const result: SemanticAnalysis = {};

  if (role) result.role = role;
  if (interactive) result.interactive = true;
  if (state && state !== 'default') result.state = state;

  return Object.keys(result).length > 0 ? result : undefined;
}
