import type { RawNodeData } from './parser';
import type {
  BorderStyle,
  Constraints,
  DesignTokens,
  ExportNode,
  GradientBackground,
} from './types';
import { TokenExtractor } from './tokens';

interface TransformContext {
  tokenExtractor: TokenExtractor;
  useTokens: boolean;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    return Math.round(n * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbaToString(r: number, g: number, b: number, a: number): string {
  if (a === 1) {
    return rgbToHex(r, g, b);
  }
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a.toFixed(2)})`;
}

type NodeTypeValue =
  | 'frame'
  | 'group'
  | 'rect'
  | 'ellipse'
  | 'text'
  | 'vector'
  | 'instance'
  | 'img';

function mapNodeType(figmaType: string): NodeTypeValue {
  const typeMap: Record<string, NodeTypeValue> = {
    FRAME: 'frame',
    GROUP: 'group',
    RECTANGLE: 'rect',
    ELLIPSE: 'ellipse',
    TEXT: 'text',
    VECTOR: 'vector',
    INSTANCE: 'instance',
    COMPONENT: 'frame',
    COMPONENT_SET: 'frame',
    LINE: 'vector',
    POLYGON: 'vector',
    STAR: 'vector',
    BOOLEAN_OPERATION: 'vector',
  };
  return typeMap[figmaType] || 'frame';
}

function mapJustify(
  align: string | undefined
): 'start' | 'center' | 'end' | 'between' | undefined {
  if (!align) return undefined;
  const map: Record<string, 'start' | 'center' | 'end' | 'between'> = {
    MIN: 'start',
    CENTER: 'center',
    MAX: 'end',
    SPACE_BETWEEN: 'between',
  };
  return map[align];
}

function mapAlign(
  align: string | undefined
): 'start' | 'center' | 'end' | 'stretch' | undefined {
  if (!align) return undefined;
  const map: Record<string, 'start' | 'center' | 'end' | 'stretch'> = {
    MIN: 'start',
    CENTER: 'center',
    MAX: 'end',
    BASELINE: 'start',
  };
  return map[align];
}

function mapConstraintH(
  constraint: string
): 'left' | 'right' | 'center' | 'stretch' | 'scale' {
  const map: Record<string, 'left' | 'right' | 'center' | 'stretch' | 'scale'> =
    {
      MIN: 'left',
      MAX: 'right',
      CENTER: 'center',
      STRETCH: 'stretch',
      SCALE: 'scale',
    };
  return map[constraint] || 'left';
}

function mapConstraintV(
  constraint: string
): 'top' | 'bottom' | 'center' | 'stretch' | 'scale' {
  const map: Record<string, 'top' | 'bottom' | 'center' | 'stretch' | 'scale'> =
    {
      MIN: 'top',
      MAX: 'bottom',
      CENTER: 'center',
      STRETCH: 'stretch',
      SCALE: 'scale',
    };
  return map[constraint] || 'top';
}

function extractBackground(
  fills: RawNodeData['fills'],
  ctx: TransformContext
): string | GradientBackground | undefined {
  if (!fills || fills.length === 0) return undefined;

  const visibleFill = fills.find((f) => f.visible !== false);
  if (!visibleFill) return undefined;

  if (visibleFill.type === 'SOLID' && visibleFill.color) {
    const { r, g, b } = visibleFill.color;
    const opacity = visibleFill.opacity ?? 1;
    const color =
      opacity === 1 ? rgbToHex(r, g, b) : rgbaToString(r, g, b, opacity);

    if (ctx.useTokens) {
      return ctx.tokenExtractor.addColor(color);
    }
    return color;
  }

  if (
    (visibleFill.type === 'GRADIENT_LINEAR' ||
      visibleFill.type === 'GRADIENT_RADIAL') &&
    visibleFill.gradientStops
  ) {
    const stops = visibleFill.gradientStops.map((stop) => {
      const color = rgbaToString(
        stop.color.r,
        stop.color.g,
        stop.color.b,
        stop.color.a
      );
      return {
        pos: Math.round(stop.position * 100) / 100,
        color: ctx.useTokens ? ctx.tokenExtractor.addColor(color) : color,
      };
    });

    let angle = 0;
    if (visibleFill.gradientTransform) {
      const [[a, b]] = visibleFill.gradientTransform;
      angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    }

    return {
      type: visibleFill.type === 'GRADIENT_LINEAR' ? 'linear' : 'radial',
      angle: angle !== 0 ? angle : undefined,
      stops,
    };
  }

  if (visibleFill.type === 'IMAGE') {
    return undefined;
  }

  return undefined;
}

function extractBorder(
  strokes: RawNodeData['strokes'],
  strokeWeight: number | undefined,
  ctx: TransformContext
): BorderStyle | undefined {
  if (!strokes || strokes.length === 0 || !strokeWeight) return undefined;

  const visibleStroke = strokes.find((s) => s.visible !== false);
  if (!visibleStroke || visibleStroke.type !== 'SOLID' || !visibleStroke.color)
    return undefined;

  const { r, g, b } = visibleStroke.color;
  const color = rgbToHex(r, g, b);

  return {
    w: strokeWeight,
    c: ctx.useTokens ? ctx.tokenExtractor.addColor(color) : color,
    style: 'solid',
  };
}

function extractShadow(
  effects: RawNodeData['effects'],
  ctx: TransformContext
): string | undefined {
  if (!effects || effects.length === 0) return undefined;

  const shadowEffects = effects.filter(
    (e) =>
      (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') &&
      e.visible !== false
  );

  if (shadowEffects.length === 0) return undefined;

  const shadows = shadowEffects.map((effect) => {
    const x = effect.offset?.x ?? 0;
    const y = effect.offset?.y ?? 0;
    const blur = effect.radius ?? 0;
    const spread = effect.spread ?? 0;
    const color = effect.color
      ? rgbaToString(
          effect.color.r,
          effect.color.g,
          effect.color.b,
          effect.color.a
        )
      : 'rgba(0,0,0,0.1)';
    const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';
    return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
  });

  const shadowValue = shadows.join(', ');
  if (ctx.useTokens) {
    return ctx.tokenExtractor.addShadow(shadowValue);
  }
  return shadowValue;
}

function extractRadius(
  raw: RawNodeData
): number | [number, number, number, number] | undefined {
  if (typeof raw.cornerRadius === 'number' && raw.cornerRadius > 0) {
    return raw.cornerRadius;
  }

  if (
    raw.topLeftRadius !== undefined ||
    raw.topRightRadius !== undefined ||
    raw.bottomRightRadius !== undefined ||
    raw.bottomLeftRadius !== undefined
  ) {
    const tl = raw.topLeftRadius ?? 0;
    const tr = raw.topRightRadius ?? 0;
    const br = raw.bottomRightRadius ?? 0;
    const bl = raw.bottomLeftRadius ?? 0;

    if (tl === tr && tr === br && br === bl) {
      return tl > 0 ? tl : undefined;
    }

    if (tl > 0 || tr > 0 || br > 0 || bl > 0) {
      return [tl, tr, br, bl];
    }
  }

  return undefined;
}

function extractPadding(
  raw: RawNodeData
): number | [number, number, number, number] | undefined {
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = raw;

  if (
    paddingTop === undefined &&
    paddingRight === undefined &&
    paddingBottom === undefined &&
    paddingLeft === undefined
  ) {
    return undefined;
  }

  const t = paddingTop ?? 0;
  const r = paddingRight ?? 0;
  const b = paddingBottom ?? 0;
  const l = paddingLeft ?? 0;

  if (t === 0 && r === 0 && b === 0 && l === 0) {
    return undefined;
  }

  if (t === r && r === b && b === l) {
    return t;
  }

  return [t, r, b, l];
}

function extractWidth(raw: RawNodeData): number | 'fill' | 'hug' {
  if (raw.layoutMode) {
    const isHorizontal = raw.layoutMode === 'HORIZONTAL';
    const sizingMode = isHorizontal
      ? raw.primaryAxisSizingMode
      : raw.counterAxisSizingMode;

    if (sizingMode === 'AUTO') {
      return 'hug';
    }
  }

  return Math.round(raw.width);
}

function extractHeight(raw: RawNodeData): number | 'fill' | 'hug' {
  if (raw.layoutMode) {
    const isHorizontal = raw.layoutMode === 'HORIZONTAL';
    const sizingMode = isHorizontal
      ? raw.counterAxisSizingMode
      : raw.primaryAxisSizingMode;

    if (sizingMode === 'AUTO') {
      return 'hug';
    }
  }

  return Math.round(raw.height);
}

function transformTextNode(
  raw: RawNodeData,
  ctx: TransformContext
): ExportNode {
  const node: ExportNode = {
    type: 'text',
    content: raw.characters || '',
  };

  if (raw.name) {
    node.name = raw.name;
  }

  if (raw.fontName) {
    node.font = ctx.useTokens
      ? ctx.tokenExtractor.addFont(raw.fontName.family)
      : raw.fontName.family;
  }

  if (raw.fontSize) {
    (node as ExportNode & { size?: number }).size = raw.fontSize;
  }

  if (raw.fontWeight) {
    (node as ExportNode & { weight?: number }).weight = raw.fontWeight;
  }

  if (raw.fills && raw.fills.length > 0) {
    const fill = raw.fills.find(
      (f) => f.visible !== false && f.type === 'SOLID'
    );
    if (fill && fill.color) {
      const color = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
      (node as ExportNode & { color?: string }).color = ctx.useTokens
        ? ctx.tokenExtractor.addColor(color)
        : color;
    }
  }

  if (raw.lineHeight) {
    if (raw.lineHeight.unit === 'PIXELS') {
      (node as ExportNode & { lineH?: number }).lineH = raw.lineHeight.value;
    } else if (raw.lineHeight.unit === 'PERCENT') {
      (node as ExportNode & { lineH?: number }).lineH =
        Math.round(raw.lineHeight.value) / 100;
    }
  }

  if (raw.letterSpacing && raw.letterSpacing.value !== 0) {
    if (raw.letterSpacing.unit === 'PIXELS') {
      (node as ExportNode & { letterS?: number }).letterS =
        raw.letterSpacing.value;
    } else if (raw.letterSpacing.unit === 'PERCENT' && raw.fontSize) {
      (node as ExportNode & { letterS?: number }).letterS =
        (raw.letterSpacing.value / 100) * raw.fontSize;
    }
  }

  if (raw.textAlignHorizontal && raw.textAlignHorizontal !== 'LEFT') {
    const alignMap: Record<string, 'left' | 'center' | 'right' | 'justify'> = {
      LEFT: 'left',
      CENTER: 'center',
      RIGHT: 'right',
      JUSTIFIED: 'justify',
    };
    (node as ExportNode & { textAlign?: string }).textAlign =
      alignMap[raw.textAlignHorizontal];
  }

  if (raw.textDecoration && raw.textDecoration !== 'NONE') {
    const decorMap: Record<string, 'underline' | 'line-through'> = {
      UNDERLINE: 'underline',
      STRIKETHROUGH: 'line-through',
    };
    (node as ExportNode & { textDecor?: string }).textDecor =
      decorMap[raw.textDecoration];
  }

  if (raw.textCase && raw.textCase !== 'ORIGINAL') {
    const caseMap: Record<string, 'uppercase' | 'lowercase' | 'capitalize'> = {
      UPPER: 'uppercase',
      LOWER: 'lowercase',
      TITLE: 'capitalize',
    };
    (node as ExportNode & { textTransform?: string }).textTransform =
      caseMap[raw.textCase];
  }

  if (raw.textTruncation === 'ENDING') {
    if (raw.maxLines && raw.maxLines > 1) {
      (node as ExportNode & { truncate?: boolean | number }).truncate =
        raw.maxLines;
    } else {
      (node as ExportNode & { truncate?: boolean | number }).truncate = true;
    }
  }

  return node;
}

function transformImageNode(
  raw: RawNodeData,
  _ctx: TransformContext
): ExportNode {
  const node: ExportNode = {
    type: 'img',
  };

  if (raw.name) {
    node.name = raw.name;
    (node as ExportNode & { alt?: string }).alt = raw.name;
  }

  node.w = extractWidth(raw);
  node.h = extractHeight(raw);

  const radius = extractRadius(raw);
  if (radius !== undefined) {
    node.radius = radius;
  }

  const imageFill = raw.fills?.find((f) => f.type === 'IMAGE');
  if (imageFill) {
    const scaleMode = imageFill.scaleMode;
    if (scaleMode === 'FILL') {
      (node as ExportNode & { fit?: string }).fit = 'cover';
    } else if (scaleMode === 'FIT') {
      (node as ExportNode & { fit?: string }).fit = 'contain';
    } else if (scaleMode === 'STRETCH') {
      (node as ExportNode & { fit?: string }).fit = 'fill';
    }
  }

  return node;
}

export function transformNode(
  raw: RawNodeData,
  ctx: TransformContext
): ExportNode {
  const hasImageFill = raw.fills?.some((f) => f.type === 'IMAGE');
  if (hasImageFill) {
    return transformImageNode(raw, ctx);
  }

  if (raw.type === 'TEXT') {
    return transformTextNode(raw, ctx);
  }

  const node = {
    type: mapNodeType(raw.type),
  } as ExportNode;

  if (raw.name) {
    node.name = raw.name;
  }

  if (raw.layoutMode && raw.layoutMode !== 'NONE') {
    node.layout = raw.layoutMode === 'HORIZONTAL' ? 'row' : 'col';

    if (raw.itemSpacing && raw.itemSpacing > 0) {
      node.gap = raw.itemSpacing;
    }

    const padding = extractPadding(raw);
    if (padding !== undefined) {
      node.p = padding;
    }

    const justify = mapJustify(raw.primaryAxisAlignItems);
    if (justify && justify !== 'start') {
      node.justify = justify;
    }

    const align = mapAlign(raw.counterAxisAlignItems);
    if (align && align !== 'start') {
      node.align = align;
    }

    if (raw.layoutWrap === 'WRAP') {
      node.wrap = true;
    }
  }

  node.w = extractWidth(raw);
  node.h = extractHeight(raw);

  if (raw.layoutPositioning === 'ABSOLUTE') {
    node.pos = 'abs';
    node.x = Math.round(raw.x);
    node.y = Math.round(raw.y);
  }

  if (raw.constraints) {
    const h = mapConstraintH(raw.constraints.horizontal);
    const v = mapConstraintV(raw.constraints.vertical);
    if (h !== 'left' || v !== 'top') {
      node.constraints = { h, v } as Constraints;
    }
  }

  const bg = extractBackground(raw.fills, ctx);
  if (bg) {
    node.bg = bg;
  }

  if (raw.opacity !== undefined && raw.opacity < 1) {
    node.opacity = Math.round(raw.opacity * 100) / 100;
  }

  const radius = extractRadius(raw);
  if (radius !== undefined) {
    node.radius = radius;
  }

  const border = extractBorder(raw.strokes, raw.strokeWeight, ctx);
  if (border) {
    node.border = border;
  }

  const shadow = extractShadow(raw.effects, ctx);
  if (shadow) {
    node.shadow = shadow;
  }

  const blurEffect = raw.effects?.find(
    (e) => e.type === 'BACKGROUND_BLUR' && e.visible !== false
  );
  if (blurEffect && blurEffect.radius) {
    node.blur = blurEffect.radius;
  }

  if (raw.clipsContent) {
    node.overflow = 'hidden';
  }

  if (raw.children && raw.children.length > 0) {
    node.ch = raw.children.map((child) => transformNode(child, ctx));
  }

  if (raw.type === 'INSTANCE' && raw.mainComponent) {
    (node as ExportNode & { componentName?: string }).componentName =
      raw.mainComponent.name;
  }

  return node;
}

export function transformTree(
  raw: RawNodeData,
  useTokens: boolean
): { tree: ExportNode; tokens: DesignTokens } {
  const tokenExtractor = new TokenExtractor();

  const ctx: TransformContext = {
    tokenExtractor,
    useTokens,
  };

  const tree = transformNode(raw, ctx);

  return {
    tree,
    tokens: tokenExtractor.getTokens(),
  };
}
