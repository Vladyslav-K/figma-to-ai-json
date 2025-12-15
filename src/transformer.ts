import type { RawNodeData } from './parser';
import type {
  BorderStyle,
  Constraints,
  DesignTokens,
  ExportNode,
  GradientBackground,
} from './types';
import { TokenExtractor } from './tokens';
import { analyzeSemantics } from './semantic';
import { detectPattern } from './patterns';
import { analyzeResponsive } from './responsive';

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
  dashPattern: number[] | undefined,
  ctx: TransformContext
): BorderStyle | undefined {
  if (!strokes || strokes.length === 0 || !strokeWeight) return undefined;

  const visibleStroke = strokes.find((s) => s.visible !== false);
  if (!visibleStroke || visibleStroke.type !== 'SOLID' || !visibleStroke.color)
    return undefined;

  const { r, g, b } = visibleStroke.color;
  const color = rgbToHex(r, g, b);

  let style: 'solid' | 'dashed' | 'dotted' = 'solid';
  if (dashPattern && dashPattern.length > 0) {
    if (dashPattern.length === 2 && dashPattern[0] === dashPattern[1]) {
      style = 'dashed';
    } else if (dashPattern.some((d) => d <= 2)) {
      style = 'dotted';
    } else {
      style = 'dashed';
    }
  }

  return {
    w: strokeWeight,
    c: ctx.useTokens ? ctx.tokenExtractor.addColor(color) : color,
    style,
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

  if (raw.paragraphSpacing && raw.paragraphSpacing > 0) {
    (node as ExportNode & { paragraphSpacing?: number }).paragraphSpacing =
      raw.paragraphSpacing;
  }

  if (raw.textAutoResize && raw.textAutoResize !== 'NONE') {
    const resizeMap: Record<string, 'height' | 'width-height'> = {
      HEIGHT: 'height',
      WIDTH_AND_HEIGHT: 'width-height',
      TRUNCATE: 'height',
    };
    const mapped = resizeMap[raw.textAutoResize];
    if (mapped) {
      (node as ExportNode & { autoResize?: string }).autoResize = mapped;
    }
  }

  if (raw.styledTextSegments && raw.styledTextSegments.length > 1) {
    const richText = raw.styledTextSegments.map((seg) => {
      const segment: {
        text: string;
        font?: string;
        size?: number;
        weight?: number;
        color?: string;
        italic?: boolean;
        underline?: boolean;
        strikethrough?: boolean;
        link?: string;
      } = {
        text: seg.characters,
      };

      if (seg.fontName && seg.fontName.family) {
        segment.font = ctx.useTokens
          ? ctx.tokenExtractor.addFont(seg.fontName.family)
          : seg.fontName.family;

        if (
          seg.fontName.style &&
          seg.fontName.style.toLowerCase().includes('italic')
        ) {
          segment.italic = true;
        }
      }

      if (seg.fontSize) {
        segment.size = seg.fontSize;
      }

      if (seg.fontWeight) {
        segment.weight = seg.fontWeight;
      }

      if (seg.fills && seg.fills.length > 0) {
        const fill = seg.fills.find(
          (f) => f.visible !== false && f.type === 'SOLID'
        );
        if (fill && fill.color) {
          const color = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
          segment.color = ctx.useTokens
            ? ctx.tokenExtractor.addColor(color)
            : color;
        }
      }

      if (seg.textDecoration === 'UNDERLINE') {
        segment.underline = true;
      } else if (seg.textDecoration === 'STRIKETHROUGH') {
        segment.strikethrough = true;
      }

      if (seg.hyperlink && seg.hyperlink.value) {
        segment.link = seg.hyperlink.value;
      }

      return segment;
    });

    (node as ExportNode & { richText?: typeof richText }).richText = richText;
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

  if (raw.imageRef) {
    (node as ExportNode & { imageRef?: string }).imageRef = raw.imageRef;
  }

  (node as ExportNode & { nodeId?: string }).nodeId = raw.id;

  (
    node as ExportNode & { originalSize?: { w: number; h: number } }
  ).originalSize = {
    w: Math.round(raw.width),
    h: Math.round(raw.height),
  };

  if (raw.imageTransform) {
    const [[a, b, tx], [c, d, ty]] = raw.imageTransform;

    const scaleX = Math.sqrt(a * a + c * c);
    const scaleY = Math.sqrt(b * b + d * d);

    if (scaleX !== 1 || scaleY !== 1 || tx !== 0 || ty !== 0) {
      const cropX = -tx / scaleX;
      const cropY = -ty / scaleY;
      const cropW = 1 / scaleX;
      const cropH = 1 / scaleY;

      if (cropX > 0.01 || cropY > 0.01 || cropW < 0.99 || cropH < 0.99) {
        (
          node as ExportNode & {
            cropRect?: { x: number; y: number; w: number; h: number };
          }
        ).cropRect = {
          x: Math.round(cropX * 100) / 100,
          y: Math.round(cropY * 100) / 100,
          w: Math.round(cropW * 100) / 100,
          h: Math.round(cropH * 100) / 100,
        };
      }
    }
  }

  return node;
}

function mapTrigger(trigger: string): 'click' | 'hover' | 'press' | 'drag' {
  const triggerMap: Record<string, 'click' | 'hover' | 'press' | 'drag'> = {
    ON_CLICK: 'click',
    ON_HOVER: 'hover',
    ON_PRESS: 'press',
    ON_DRAG: 'drag',
    MOUSE_ENTER: 'hover',
    MOUSE_LEAVE: 'hover',
    MOUSE_UP: 'click',
    MOUSE_DOWN: 'press',
  };
  return triggerMap[trigger] || 'click';
}

function mapAction(
  action: string
): 'navigate' | 'overlay' | 'swap' | 'scroll' | 'url' | 'back' | 'close' {
  const actionMap: Record<
    string,
    'navigate' | 'overlay' | 'swap' | 'scroll' | 'url' | 'back' | 'close'
  > = {
    NODE: 'navigate',
    OVERLAY: 'overlay',
    SWAP: 'swap',
    SCROLL_TO: 'scroll',
    URL: 'url',
    BACK: 'back',
    CLOSE: 'close',
  };
  return actionMap[action] || 'navigate';
}

function mapBlendMode(mode: string): string | undefined {
  const modeMap: Record<string, string> = {
    MULTIPLY: 'multiply',
    SCREEN: 'screen',
    OVERLAY: 'overlay',
    DARKEN: 'darken',
    LIGHTEN: 'lighten',
    COLOR_DODGE: 'color-dodge',
    COLOR_BURN: 'color-burn',
    HARD_LIGHT: 'hard-light',
    SOFT_LIGHT: 'soft-light',
    DIFFERENCE: 'difference',
    EXCLUSION: 'exclusion',
    HUE: 'hue',
    SATURATION: 'saturation',
    COLOR: 'color',
    LUMINOSITY: 'luminosity',
  };
  return modeMap[mode];
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

  const border = extractBorder(
    raw.strokes,
    raw.strokeWeight,
    raw.dashPattern,
    ctx
  );
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

  const backdropBlurEffect = raw.effects?.find(
    (e) => e.type === 'LAYER_BLUR' && e.visible !== false
  );
  if (backdropBlurEffect && backdropBlurEffect.radius) {
    (node as ExportNode & { backdropBlur?: number }).backdropBlur =
      backdropBlurEffect.radius;
  }

  if (raw.blendMode) {
    const mappedBlend = mapBlendMode(raw.blendMode);
    if (mappedBlend) {
      (node as ExportNode & { blendMode?: string }).blendMode = mappedBlend;
    }
  }

  if (raw.rotation) {
    (node as ExportNode & { rotate?: number }).rotate =
      Math.round(raw.rotation * 100) / 100;
  }

  if (raw.width && raw.height && raw.width !== raw.height) {
    const ratio = raw.width / raw.height;
    if (Math.abs(ratio - Math.round(ratio * 100) / 100) < 0.01) {
      const commonRatios = [16 / 9, 4 / 3, 3 / 2, 1 / 1, 9 / 16, 3 / 4, 2 / 3];
      const isCommon = commonRatios.some((r) => Math.abs(ratio - r) < 0.05);
      if (isCommon) {
        (node as ExportNode & { aspectRatio?: number }).aspectRatio =
          Math.round(ratio * 100) / 100;
      }
    }
  }

  if (raw.layoutPositioning === 'ABSOLUTE' && raw.orderIndex !== undefined) {
    (node as ExportNode & { zIndex?: number }).zIndex = raw.orderIndex + 1;
  }

  if (raw.orderIndex !== undefined && raw.siblingCount !== undefined) {
    if (raw.siblingCount > 1) {
      (node as ExportNode & { order?: number }).order = raw.orderIndex;

      if (raw.orderIndex === 0) {
        (node as ExportNode & { isFirst?: boolean }).isFirst = true;
      }

      if (raw.orderIndex === raw.siblingCount - 1) {
        (node as ExportNode & { isLast?: boolean }).isLast = true;
      }
    }
  }

  const responsive = analyzeResponsive(raw, raw.parentLayoutMode);
  if (responsive) {
    node.responsive = responsive;
  }

  const devInfo: {
    notes?: string;
    description?: string;
    pluginData?: Record<string, string>;
  } = {};

  if (raw.description) {
    devInfo.description = raw.description;
  }

  if (raw.devNotes) {
    devInfo.notes = raw.devNotes;
  }

  if (raw.pluginData && Object.keys(raw.pluginData).length > 0) {
    devInfo.pluginData = raw.pluginData;
  }

  if (Object.keys(devInfo).length > 0) {
    (node as ExportNode & { devInfo?: typeof devInfo }).devInfo = devInfo;
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

    if (
      raw.mainComponent.variantProperties &&
      Object.keys(raw.mainComponent.variantProperties).length > 0
    ) {
      (
        node as ExportNode & { variantProps?: Record<string, string> }
      ).variantProps = raw.mainComponent.variantProperties;
    }

    if (raw.mainComponent.description) {
      (node as ExportNode & { componentDesc?: string }).componentDesc =
        raw.mainComponent.description;
    }
  }

  const semantic = analyzeSemantics(raw);
  if (semantic) {
    node.semantic = semantic;
  }

  if (raw.reactions && raw.reactions.length > 0) {
    const interactions = raw.reactions.map((r) => {
      const interaction: {
        trigger: 'click' | 'hover' | 'press' | 'drag';
        action:
          | 'navigate'
          | 'overlay'
          | 'swap'
          | 'scroll'
          | 'url'
          | 'back'
          | 'close';
        dest?: string;
        url?: string;
        transition?: string;
      } = {
        trigger: mapTrigger(r.trigger),
        action: mapAction(r.action),
      };

      if (r.destinationName) {
        interaction.dest = r.destinationName;
      }

      if (r.url) {
        interaction.url = r.url;
      }

      if (r.transition) {
        interaction.transition = r.transition.toLowerCase();
      }

      return interaction;
    });

    (node as ExportNode & { interactions?: typeof interactions }).interactions =
      interactions;
  }

  const patternInfo = detectPattern(raw);
  if (patternInfo) {
    node.patternInfo = patternInfo;
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
