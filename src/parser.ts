import type { ExportOptions } from './types';

export interface RawNodeData {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE' | 'GRID';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  layoutWrap?: 'NO_WRAP' | 'WRAP';
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  dashPattern?: number[];
  blendMode?: string;
  rotation?: number;
  orderIndex?: number;
  siblingCount?: number;
  layoutGrow?: number;
  parentLayoutMode?: string;
  description?: string;
  devNotes?: string;
  pluginData?: Record<string, string>;
  imageRef?: string;
  imageTransform?: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
  ];
  cornerRadius?: number;
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomRightRadius?: number;
  bottomLeftRadius?: number;
  effects?: Effect[];
  opacity?: number;
  visible?: boolean;
  clipsContent?: boolean;
  constraints?: {
    horizontal: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
    vertical: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
  };
  layoutPositioning?: 'AUTO' | 'ABSOLUTE';
  characters?: string;
  fontSize?: number;
  fontName?: { family: string; style: string };
  fontWeight?: number;
  lineHeight?: { value: number; unit: 'PIXELS' | 'PERCENT' | 'AUTO' };
  letterSpacing?: { value: number; unit: 'PIXELS' | 'PERCENT' };
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  textCase?:
    | 'ORIGINAL'
    | 'UPPER'
    | 'LOWER'
    | 'TITLE'
    | 'SMALL_CAPS'
    | 'SMALL_CAPS_FORCED';
  textTruncation?: 'DISABLED' | 'ENDING';
  maxLines?: number;
  paragraphSpacing?: number;
  textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
  styledTextSegments?: Array<{
    characters: string;
    start: number;
    end: number;
    fontName?: { family: string; style: string };
    fontSize?: number;
    fontWeight?: number;
    fills?: Paint[];
    textDecoration?: string;
    hyperlink?: { type: string; value: string };
  }>;
  children?: RawNodeData[];
  mainComponent?: {
    name: string;
    description?: string;
    variantProperties?: Record<string, string>;
  };
  reactions?: Array<{
    trigger: string;
    action: string;
    destinationId?: string;
    destinationName?: string;
    url?: string;
    transition?: string;
  }>;
}

interface Paint {
  type: string;
  visible?: boolean;
  opacity?: number;
  color?: { r: number; g: number; b: number };
  gradientStops?: ReadonlyArray<{
    position: number;
    color: { r: number; g: number; b: number; a: number };
  }>;
  gradientTransform?: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
  ];
  imageRef?: string;
  scaleMode?: string;
  imageTransform?: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
  ];
  scalingFactor?: number;
}

interface Effect {
  type: string;
  visible?: boolean;
  radius?: number;
  offset?: { x: number; y: number };
  spread?: number;
  color?: { r: number; g: number; b: number; a: number };
}

function isVisibleNode(node: SceneNode): boolean {
  return node.visible;
}

function hasChildren(
  node: SceneNode
): node is FrameNode | GroupNode | ComponentNode | InstanceNode {
  return 'children' in node;
}

function hasFills(
  node: SceneNode
): node is FrameNode | RectangleNode | EllipseNode | TextNode {
  return 'fills' in node;
}

function hasStrokes(node: SceneNode): node is GeometryMixin & SceneNode {
  return 'strokes' in node;
}

function hasEffects(node: SceneNode): node is BlendMixin & SceneNode {
  return 'effects' in node;
}

function hasCornerRadius(
  node: SceneNode
): node is FrameNode | RectangleNode | ComponentNode | InstanceNode {
  return 'cornerRadius' in node;
}

function hasLayout(
  node: SceneNode
): node is FrameNode | ComponentNode | InstanceNode {
  return 'layoutMode' in node;
}

function hasConstraints(node: SceneNode): node is ConstraintMixin & SceneNode {
  return 'constraints' in node;
}

function extractPaints(fills: readonly Paint[] | PluginAPI['mixed']): Paint[] {
  if (fills === figma.mixed || !Array.isArray(fills)) {
    return [];
  }
  return fills.filter((f) => f.visible !== false) as Paint[];
}

function extractEffects(
  effects: readonly Effect[] | PluginAPI['mixed']
): Effect[] {
  if (effects === figma.mixed || !Array.isArray(effects)) {
    return [];
  }
  return effects.filter((e) => e.visible !== false) as Effect[];
}

export async function parseNode(
  node: SceneNode,
  options: ExportOptions,
  depth: number = 0
): Promise<RawNodeData | null> {
  if (!isVisibleNode(node)) {
    return null;
  }

  if (options.maxDepth > 0 && depth > options.maxDepth) {
    return null;
  }

  const raw: RawNodeData = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  };

  if ('opacity' in node && node.opacity !== 1) {
    raw.opacity = node.opacity;
  }

  raw.visible = node.visible;

  if (hasLayout(node)) {
    if (node.layoutMode !== 'NONE') {
      raw.layoutMode = node.layoutMode;
      raw.primaryAxisSizingMode = node.primaryAxisSizingMode;
      raw.counterAxisSizingMode = node.counterAxisSizingMode;
      raw.primaryAxisAlignItems = node.primaryAxisAlignItems;
      raw.counterAxisAlignItems = node.counterAxisAlignItems;
      raw.paddingLeft = node.paddingLeft;
      raw.paddingRight = node.paddingRight;
      raw.paddingTop = node.paddingTop;
      raw.paddingBottom = node.paddingBottom;
      raw.itemSpacing = node.itemSpacing;

      if ('layoutWrap' in node) {
        raw.layoutWrap = node.layoutWrap as 'NO_WRAP' | 'WRAP';
      }

      if ('layoutGrow' in node && typeof node.layoutGrow === 'number') {
        raw.layoutGrow = node.layoutGrow;
      }
    }

    if ('clipsContent' in node) {
      raw.clipsContent = node.clipsContent;
    }
  }

  if (hasConstraints(node)) {
    raw.constraints = {
      horizontal: node.constraints.horizontal,
      vertical: node.constraints.vertical,
    };
  }

  if ('layoutPositioning' in node) {
    raw.layoutPositioning = (node as FrameNode).layoutPositioning;
  }

  if (hasFills(node)) {
    raw.fills = extractPaints(node.fills);
    const imageFill = raw.fills?.find((f) => f.type === 'IMAGE');
    if (imageFill) {
      if (imageFill.imageRef) {
        raw.imageRef = imageFill.imageRef;
      }
      if (imageFill.imageTransform) {
        raw.imageTransform = imageFill.imageTransform;
      }
    }
  }

  if (hasStrokes(node)) {
    raw.strokes = extractPaints(node.strokes);
    if ('strokeWeight' in node && typeof node.strokeWeight === 'number') {
      raw.strokeWeight = node.strokeWeight;
    }
    if ('strokeAlign' in node) {
      raw.strokeAlign = node.strokeAlign as 'INSIDE' | 'OUTSIDE' | 'CENTER';
    }
    if ('dashPattern' in node) {
      const dashNode = node as SceneNode & { dashPattern: readonly number[] };
      if (dashNode.dashPattern && dashNode.dashPattern.length > 0) {
        raw.dashPattern = [...dashNode.dashPattern];
      }
    }
  }

  if (hasCornerRadius(node)) {
    if (typeof node.cornerRadius === 'number') {
      raw.cornerRadius = node.cornerRadius;
    } else {
      raw.topLeftRadius = node.topLeftRadius;
      raw.topRightRadius = node.topRightRadius;
      raw.bottomRightRadius = node.bottomRightRadius;
      raw.bottomLeftRadius = node.bottomLeftRadius;
    }
  }

  if (hasEffects(node)) {
    raw.effects = extractEffects(node.effects);
  }

  if ('blendMode' in node) {
    const blendNode = node as SceneNode & { blendMode: string };
    if (
      blendNode.blendMode &&
      blendNode.blendMode !== 'NORMAL' &&
      blendNode.blendMode !== 'PASS_THROUGH'
    ) {
      raw.blendMode = blendNode.blendMode;
    }
  }

  if ('rotation' in node) {
    const rotationNode = node as SceneNode & { rotation: number };
    if (rotationNode.rotation && Math.abs(rotationNode.rotation) > 0.1) {
      raw.rotation = rotationNode.rotation;
    }
  }

  if ('description' in node) {
    const descNode = node as SceneNode & { description: string };
    if (descNode.description && descNode.description.trim()) {
      raw.description = descNode.description.trim();
    }
  }

  try {
    const sharedPluginKeys = node.getSharedPluginDataKeys('*');
    if (sharedPluginKeys && sharedPluginKeys.length > 0) {
      const pluginData: Record<string, string> = {};
      for (const key of sharedPluginKeys) {
        const value = node.getSharedPluginData('*', key);
        if (value) {
          pluginData[key] = value;
        }
      }
      if (Object.keys(pluginData).length > 0) {
        raw.pluginData = pluginData;
      }
    }
  } catch {
    // Ignore errors when getting plugin data
  }

  const notePatterns = [
    /\[note:?\s*(.+?)\]/i,
    /\(note:?\s*(.+?)\)/i,
    /\/\/\s*(.+)$/,
    /--\s*(.+)$/,
  ];

  for (const pattern of notePatterns) {
    const match = node.name.match(pattern);
    if (match && match[1]) {
      raw.devNotes = match[1].trim();
      break;
    }
  }

  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    raw.characters = textNode.characters;

    if (typeof textNode.fontSize === 'number') {
      raw.fontSize = textNode.fontSize;
    }

    if (textNode.fontName !== figma.mixed) {
      raw.fontName = textNode.fontName;
    }

    if (typeof textNode.fontWeight === 'number') {
      raw.fontWeight = textNode.fontWeight;
    }

    if (textNode.lineHeight !== figma.mixed) {
      raw.lineHeight = textNode.lineHeight as {
        value: number;
        unit: 'PIXELS' | 'PERCENT' | 'AUTO';
      };
    }

    if (textNode.letterSpacing !== figma.mixed) {
      raw.letterSpacing = textNode.letterSpacing as {
        value: number;
        unit: 'PIXELS' | 'PERCENT';
      };
    }

    raw.textAlignHorizontal = textNode.textAlignHorizontal;
    raw.textAlignVertical = textNode.textAlignVertical;

    if (
      textNode.textDecoration !== figma.mixed &&
      textNode.textDecoration !== 'NONE'
    ) {
      raw.textDecoration = textNode.textDecoration;
    }

    if (textNode.textCase !== figma.mixed && textNode.textCase !== 'ORIGINAL') {
      raw.textCase = textNode.textCase;
    }

    if (
      'textTruncation' in textNode &&
      textNode.textTruncation !== 'DISABLED'
    ) {
      raw.textTruncation = textNode.textTruncation as 'DISABLED' | 'ENDING';
      if ('maxLines' in textNode && typeof textNode.maxLines === 'number') {
        raw.maxLines = textNode.maxLines;
      }
    }

    if (
      'paragraphSpacing' in textNode &&
      typeof textNode.paragraphSpacing === 'number'
    ) {
      raw.paragraphSpacing = textNode.paragraphSpacing;
    }

    if ('textAutoResize' in textNode) {
      raw.textAutoResize = textNode.textAutoResize as
        | 'NONE'
        | 'WIDTH_AND_HEIGHT'
        | 'HEIGHT'
        | 'TRUNCATE';
    }

    try {
      const segments = textNode.getStyledTextSegments([
        'fontName',
        'fontSize',
        'fontWeight',
        'fills',
        'textDecoration',
        'hyperlink',
      ]);

      if (segments.length > 1) {
        raw.styledTextSegments = segments.map((seg) => ({
          characters: seg.characters,
          start: seg.start,
          end: seg.end,
          fontName: seg.fontName,
          fontSize: seg.fontSize,
          fontWeight: seg.fontWeight,
          fills: seg.fills as Paint[],
          textDecoration: seg.textDecoration,
          hyperlink: seg.hyperlink as
            | { type: string; value: string }
            | undefined,
        }));
      }
    } catch {
      // Ignore errors when getting styled segments
    }
  }

  if (node.type === 'INSTANCE') {
    const instanceNode = node as InstanceNode;
    try {
      const mainComponent = await instanceNode.getMainComponentAsync();
      if (mainComponent) {
        raw.mainComponent = {
          name: mainComponent.name,
          description: mainComponent.description || undefined,
        };

        if (instanceNode.variantProperties) {
          raw.mainComponent.variantProperties = {
            ...instanceNode.variantProperties,
          };
        }
      }
    } catch {
      // Ignore errors when getting main component
    }
  }

  if ('reactions' in node) {
    const reactionsNode = node as SceneNode & {
      reactions: readonly Reaction[];
    };
    if (reactionsNode.reactions && reactionsNode.reactions.length > 0) {
      const reactions: RawNodeData['reactions'] = [];

      for (const reaction of reactionsNode.reactions) {
        if (reaction.action && reaction.trigger) {
          const reactionData: NonNullable<RawNodeData['reactions']>[number] = {
            trigger: reaction.trigger.type,
            action: reaction.action.type,
          };

          if (
            reaction.action.type === 'NODE' &&
            'destinationId' in reaction.action
          ) {
            const nodeAction = reaction.action as {
              destinationId: string | null;
            };
            if (nodeAction.destinationId) {
              reactionData.destinationId = nodeAction.destinationId;
              try {
                const destNode = figma.getNodeById(nodeAction.destinationId);
                if (destNode) {
                  reactionData.destinationName = destNode.name;
                }
              } catch {
                // Ignore errors
              }
            }
          }

          if (reaction.action.type === 'URL' && 'url' in reaction.action) {
            reactionData.url = (reaction.action as { url: string }).url;
          }

          if ('transition' in reaction.action && reaction.action.transition) {
            const transition = reaction.action.transition as { type: string };
            reactionData.transition = transition.type;
          }

          reactions.push(reactionData);
        }
      }

      if (reactions.length > 0) {
        raw.reactions = reactions;
      }
    }
  }

  if (options.includeChildren && hasChildren(node)) {
    const childrenData: RawNodeData[] = [];
    const totalChildren = node.children.length;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childData = await parseNode(child, options, depth + 1);
      if (childData) {
        childData.orderIndex = i;
        childData.siblingCount = totalChildren;
        childData.parentLayoutMode = raw.layoutMode;
        childrenData.push(childData);
      }
    }
    if (childrenData.length > 0) {
      raw.children = childrenData;
    }
  }

  return raw;
}
