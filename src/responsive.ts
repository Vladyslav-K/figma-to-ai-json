import type { Breakpoint, ResponsiveInfo } from './types';
import type { RawNodeData } from './parser';

const BREAKPOINT_PATTERNS: Record<Breakpoint, RegExp> = {
  mobile: /mobile|phone|sm|small|320|375|390|414/i,
  tablet: /tablet|ipad|md|medium|768|834|820/i,
  desktop: /desktop|lg|large|1024|1280|1440/i,
  wide: /wide|xl|extra.?large|1920|2560/i,
};

const BREAKPOINT_WIDTHS: Record<Breakpoint, { min: number; max: number }> = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 1919 },
  wide: { min: 1920, max: Infinity },
};

export function detectBreakpointFromName(name: string): Breakpoint | undefined {
  for (const [breakpoint, pattern] of Object.entries(BREAKPOINT_PATTERNS)) {
    if (pattern.test(name)) {
      return breakpoint as Breakpoint;
    }
  }
  return undefined;
}

export function detectBreakpointFromWidth(
  width: number
): Breakpoint | undefined {
  for (const [breakpoint, range] of Object.entries(BREAKPOINT_WIDTHS)) {
    if (width >= range.min && width <= range.max) {
      return breakpoint as Breakpoint;
    }
  }
  return undefined;
}

export function isFluidWidth(raw: RawNodeData): boolean {
  if (raw.layoutMode && raw.layoutMode !== 'NONE') {
    const isHorizontal = raw.layoutMode === 'HORIZONTAL';
    const sizingMode = isHorizontal
      ? raw.counterAxisSizingMode
      : raw.primaryAxisSizingMode;

    if (sizingMode === 'AUTO') {
      return false;
    }
  }

  if (raw.constraints) {
    if (
      raw.constraints.horizontal === 'STRETCH' ||
      raw.constraints.horizontal === 'SCALE'
    ) {
      return true;
    }
  }

  return false;
}

export function detectFlexGrow(
  raw: RawNodeData,
  parentLayout?: string
): number | undefined {
  if (!parentLayout || parentLayout === 'NONE') {
    return undefined;
  }

  const isParentHorizontal = parentLayout === 'HORIZONTAL';

  if (isParentHorizontal) {
    if (raw.layoutGrow !== undefined && raw.layoutGrow > 0) {
      return raw.layoutGrow;
    }
  } else {
    if (raw.layoutGrow !== undefined && raw.layoutGrow > 0) {
      return raw.layoutGrow;
    }
  }

  return undefined;
}

export function analyzeResponsive(
  raw: RawNodeData,
  parentLayout?: string
): ResponsiveInfo | undefined {
  const info: ResponsiveInfo = {};

  const breakpointFromName = detectBreakpointFromName(raw.name);
  if (breakpointFromName) {
    info.breakpoint = breakpointFromName;
  } else if (raw.width >= 1024) {
    const breakpointFromWidth = detectBreakpointFromWidth(raw.width);
    if (breakpointFromWidth && breakpointFromWidth !== 'mobile') {
      info.breakpoint = breakpointFromWidth;
    }
  }

  if (isFluidWidth(raw)) {
    info.fluid = true;
  }

  const grow = detectFlexGrow(raw, parentLayout);
  if (grow !== undefined && grow > 0) {
    info.grow = grow;
  }

  if (raw.layoutGrow === 0 && parentLayout && parentLayout !== 'NONE') {
    info.shrink = 0;
  }

  if (Object.keys(info).length === 0) {
    return undefined;
  }

  return info;
}
