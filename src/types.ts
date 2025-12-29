export interface ExportOptions {
  includeChildren: boolean;
  extractTokens: boolean;
  optimizeSize: boolean;
  maxDepth: number;
}

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface ResponsiveInfo {
  breakpoint?: Breakpoint;
  fluid?: boolean;
  grow?: number;
  shrink?: number;
  basis?: number | 'auto';
}

export interface DevAnnotations {
  notes?: string;
  description?: string;
  pluginData?: Record<string, string>;
}

export type UIPattern =
  | 'grid'
  | 'list'
  | 'carousel'
  | 'tabs'
  | 'accordion'
  | 'form'
  | 'table'
  | 'breadcrumbs'
  | 'pagination'
  | 'stepper'
  | 'gallery';

export interface PatternInfo {
  pattern: UIPattern;
  itemCount?: number;
  columns?: number;
  rows?: number;
}

export type SemanticRole =
  | 'button'
  | 'input'
  | 'card'
  | 'nav'
  | 'header'
  | 'footer'
  | 'modal'
  | 'badge'
  | 'avatar'
  | 'icon'
  | 'link'
  | 'list'
  | 'listItem'
  | 'tab'
  | 'menu'
  | 'tooltip'
  | 'dropdown';

export type ComponentState =
  | 'default'
  | 'hover'
  | 'active'
  | 'disabled'
  | 'focus'
  | 'selected'
  | 'loading';

export interface SemanticInfo {
  role?: SemanticRole;
  interactive?: boolean;
  state?: ComponentState;
}

export type InteractionTrigger = 'click' | 'hover' | 'press' | 'drag';

export type InteractionAction =
  | 'navigate'
  | 'overlay'
  | 'swap'
  | 'scroll'
  | 'url'
  | 'back'
  | 'close';

export interface InteractionInfo {
  trigger: InteractionTrigger;
  action: InteractionAction;
  dest?: string;
  url?: string;
  transition?: string;
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
  sides?: 'all' | 'top' | 'right' | 'bottom' | 'left';
}

export interface Constraints {
  h: 'left' | 'right' | 'center' | 'stretch' | 'scale';
  v: 'top' | 'bottom' | 'center' | 'stretch' | 'scale';
}

export interface BaseNode {
  id?: string;
  n?: string;
  t: string;
  w?: number | 'fill' | 'hug';
  h?: number | 'fill' | 'hug';
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  l?: 'row' | 'col';
  g?: number;
  p?: number | [number, number, number, number];
  j?: 'start' | 'center' | 'end' | 'between';
  al?: 'start' | 'center' | 'end' | 'stretch';
  wr?: boolean;
  ps?: 'abs' | 'rel';
  x?: number;
  y?: number;
  cn?: Constraints;
  bg?: string | GradientBackground;
  o?: number;
  r?: number | [number, number, number, number];
  bd?: BorderStyle;
  sh?: string;
  bl?: number;
  bbl?: number;
  bm?: string;
  rt?: number;
  ar?: number;
  z?: number;
  ord?: number;
  iF?: boolean;
  iL?: boolean;
  rs?: ResponsiveInfo;
  di?: DevAnnotations;
  vs?: boolean;
  of?: 'hidden' | 'scroll' | 'visible';
  sm?: SemanticInfo;
  ia?: InteractionInfo[];
  pi?: PatternInfo;
  ch?: ExportNode[];
}

export interface TextSegment {
  text: string;
  f?: string;
  s?: number;
  wt?: number;
  cl?: string;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  link?: string;
}

export interface TextNode extends BaseNode {
  t: 'text';
  c: string;
  f?: string;
  s?: number;
  wt?: number;
  cl?: string;
  lh?: number | string;
  ls?: number;
  ta?: 'left' | 'center' | 'right' | 'justify';
  td?: 'underline' | 'line-through' | 'none';
  tt?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  tr?: boolean | number;
  psp?: number;
  ars?: 'none' | 'height' | 'width-height';
  rT?: TextSegment[];
}

export interface ImageNode extends BaseNode {
  t: 'img';
  src?: string;
  ft?: 'cover' | 'contain' | 'fill' | 'none';
  alt?: string;
  iR?: string;
  oS?: { w: number; h: number };
  cR?: { x: number; y: number; w: number; h: number };
  nId?: string;
}

export interface FrameNode extends BaseNode {
  t: 'frame';
}

export interface RectNode extends BaseNode {
  t: 'rect';
}

export interface EllipseNode extends BaseNode {
  t: 'ellipse';
}

export interface VectorNode extends BaseNode {
  t: 'vector';
}

export interface GroupNode extends BaseNode {
  t: 'group';
}

export interface InstanceNode extends BaseNode {
  t: 'instance';
  componentName?: string;
  variantProps?: Record<string, string>;
  componentDesc?: string;
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
  keys: string;
  base: string;
  text: string;
  image: string;
  border: string;
  tokens: string;
  values: string;
  semantic: string;
  interactions: string;
  patterns: string;
  responsive: string;
  devInfo: string;
  css: string;
  html: string;
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
