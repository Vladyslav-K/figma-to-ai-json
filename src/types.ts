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
  backdropBlur?: number;
  blendMode?: string;
  rotate?: number;
  aspectRatio?: number;
  zIndex?: number;
  order?: number;
  isFirst?: boolean;
  isLast?: boolean;
  responsive?: ResponsiveInfo;
  devInfo?: DevAnnotations;
  visible?: boolean;
  overflow?: 'hidden' | 'scroll' | 'visible';
  semantic?: SemanticInfo;
  interactions?: InteractionInfo[];
  patternInfo?: PatternInfo;
  ch?: ExportNode[];
}

export interface TextSegment {
  text: string;
  font?: string;
  size?: number;
  weight?: number;
  color?: string;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  link?: string;
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
  paragraphSpacing?: number;
  autoResize?: 'none' | 'height' | 'width-height';
  richText?: TextSegment[];
}

export interface ImageNode extends BaseNode {
  type: 'img';
  src?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  alt?: string;
  imageRef?: string;
  originalSize?: { w: number; h: number };
  cropRect?: { x: number; y: number; w: number; h: number };
  nodeId?: string;
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
  tailwind: string;
  react: string;
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
