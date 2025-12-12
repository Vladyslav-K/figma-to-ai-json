export interface ExportOptions {
  includeChildren: boolean;
  extractTokens: boolean;
  optimizeSize: boolean;
  maxDepth: number;
}

export interface DesignTokens {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  shadows: Record<string, string>;
}

export interface GradientStop {
  pos: number;
  color: string;
}

export interface GradientBackground {
  type: 'linear' | 'radial';
  angle?: number;
  stops: GradientStop[];
}

export interface BorderStyle {
  w: number;
  c: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface Constraints {
  h: 'left' | 'right' | 'center' | 'stretch' | 'scale';
  v: 'top' | 'bottom' | 'center' | 'stretch' | 'scale';
}

export interface BaseNode {
  id?: string;
  name?: string;
  type: string;
  w?: number | 'fill' | 'hug';
  h?: number | 'fill' | 'hug';
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  layout?: 'row' | 'col';
  gap?: number;
  p?: number | [number, number, number, number];
  justify?: 'start' | 'center' | 'end' | 'between';
  align?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
  pos?: 'abs' | 'rel';
  x?: number;
  y?: number;
  constraints?: Constraints;
  bg?: string | GradientBackground;
  opacity?: number;
  radius?: number | [number, number, number, number];
  border?: BorderStyle;
  shadow?: string;
  blur?: number;
  visible?: boolean;
  overflow?: 'hidden' | 'scroll' | 'visible';
  ch?: ExportNode[];
}

export interface TextNode extends BaseNode {
  type: 'text';
  content: string;
  font?: string;
  size?: number;
  weight?: number;
  color?: string;
  lineH?: number | string;
  letterS?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecor?: 'underline' | 'line-through' | 'none';
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  truncate?: boolean | number;
}

export interface ImageNode extends BaseNode {
  type: 'img';
  src?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  alt?: string;
}

export interface FrameNode extends BaseNode {
  type: 'frame';
}

export interface RectNode extends BaseNode {
  type: 'rect';
}

export interface EllipseNode extends BaseNode {
  type: 'ellipse';
}

export interface VectorNode extends BaseNode {
  type: 'vector';
}

export interface GroupNode extends BaseNode {
  type: 'group';
}

export interface InstanceNode extends BaseNode {
  type: 'instance';
  componentName?: string;
}

export type ExportNode =
  | TextNode
  | ImageNode
  | FrameNode
  | RectNode
  | EllipseNode
  | VectorNode
  | GroupNode
  | InstanceNode;

export interface MetaInfo {
  format: string;
  types: string;
  base: string;
  text: string;
  image: string;
  border: string;
  tokens: string;
  values: string;
}

export interface ExportResult {
  v: string;
  _meta: MetaInfo;
  name: string;
  tokens: DesignTokens;
  tree: ExportNode;
}

export interface UIMessage {
  type: 'export' | 'error' | 'copy';
  data?: ExportResult;
  error?: string;
  json?: string;
}
