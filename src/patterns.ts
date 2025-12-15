import type { UIPattern, PatternInfo } from './types';
import type { RawNodeData } from './parser';

const PATTERN_NAME_HINTS: Record<UIPattern, RegExp> = {
  grid: /grid|cards|products|gallery/i,
  list: /list|items|rows|feed/i,
  carousel: /carousel|slider|swiper|slides/i,
  tabs: /tabs|tabbar|tab.?list|segments/i,
  accordion: /accordion|collapse|expandable|faq/i,
  form: /form|login|signup|register|checkout|contact/i,
  table: /table|datagrid|data.?table/i,
  breadcrumbs: /breadcrumb|crumbs|path/i,
  pagination: /pagination|pager|pages/i,
  stepper: /stepper|steps|wizard|progress/i,
  gallery: /gallery|photos|images/i,
};

function detectPatternFromName(name: string): UIPattern | undefined {
  for (const [pattern, regex] of Object.entries(PATTERN_NAME_HINTS)) {
    if (regex.test(name)) {
      return pattern as UIPattern;
    }
  }
  return undefined;
}

function areSimilarNodes(a: RawNodeData, b: RawNodeData): boolean {
  if (a.type !== b.type) return false;

  const widthDiff = Math.abs(a.width - b.width);
  const heightDiff = Math.abs(a.height - b.height);
  const sizeTolerance = 10;

  if (widthDiff > sizeTolerance || heightDiff > sizeTolerance) {
    return false;
  }

  const aChildCount = a.children?.length ?? 0;
  const bChildCount = b.children?.length ?? 0;

  if (Math.abs(aChildCount - bChildCount) > 1) {
    return false;
  }

  return true;
}

function countSimilarChildren(children: RawNodeData[]): number {
  if (children.length < 2) return 0;

  let similarCount = 1;
  const reference = children[0];

  for (let i = 1; i < children.length; i++) {
    if (areSimilarNodes(reference, children[i])) {
      similarCount++;
    }
  }

  return similarCount;
}

function detectGridPattern(raw: RawNodeData): PatternInfo | undefined {
  if (!raw.children || raw.children.length < 2) return undefined;

  const isWrap = raw.layoutWrap === 'WRAP';
  const similarCount = countSimilarChildren(raw.children);
  const hasMostlySimilar = similarCount >= raw.children.length * 0.7;

  if (isWrap && hasMostlySimilar && raw.children.length >= 4) {
    const firstChild = raw.children[0];
    const containerWidth = raw.width;
    const itemWidth = firstChild.width;
    const gap = raw.itemSpacing ?? 0;

    const columns = Math.floor((containerWidth + gap) / (itemWidth + gap));
    const rows = Math.ceil(raw.children.length / columns);

    return {
      pattern: 'grid',
      itemCount: raw.children.length,
      columns: Math.max(1, columns),
      rows: Math.max(1, rows),
    };
  }

  return undefined;
}

function detectListPattern(raw: RawNodeData): PatternInfo | undefined {
  if (!raw.children || raw.children.length < 2) return undefined;

  const isVertical = raw.layoutMode === 'VERTICAL';
  const similarCount = countSimilarChildren(raw.children);
  const hasMostlySimilar = similarCount >= raw.children.length * 0.7;

  if (isVertical && hasMostlySimilar && raw.children.length >= 2) {
    return {
      pattern: 'list',
      itemCount: raw.children.length,
    };
  }

  return undefined;
}

function detectCarouselPattern(raw: RawNodeData): PatternInfo | undefined {
  if (!raw.children || raw.children.length < 2) return undefined;

  const isHorizontal = raw.layoutMode === 'HORIZONTAL';
  const hasOverflow = raw.clipsContent === true;
  const similarCount = countSimilarChildren(raw.children);
  const hasMostlySimilar = similarCount >= raw.children.length * 0.7;

  const totalChildrenWidth = raw.children.reduce(
    (sum, child) => sum + child.width,
    0
  );
  const gap = raw.itemSpacing ?? 0;
  const totalWidth = totalChildrenWidth + gap * (raw.children.length - 1);
  const overflowsContainer = totalWidth > raw.width * 1.2;

  if (isHorizontal && hasOverflow && hasMostlySimilar && overflowsContainer) {
    return {
      pattern: 'carousel',
      itemCount: raw.children.length,
    };
  }

  return undefined;
}

function detectTabsPattern(raw: RawNodeData): PatternInfo | undefined {
  if (!raw.children || raw.children.length < 2) return undefined;

  const isHorizontal = raw.layoutMode === 'HORIZONTAL';
  const hasTextChildren = raw.children.every(
    (child) =>
      child.type === 'TEXT' ||
      (child.children && child.children.some((c) => c.type === 'TEXT'))
  );

  const allSimilarSize = raw.children.every((child) => {
    const heightDiff = Math.abs(child.height - raw.children![0].height);
    return heightDiff < 10;
  });

  if (
    isHorizontal &&
    hasTextChildren &&
    allSimilarSize &&
    raw.children.length <= 8
  ) {
    return {
      pattern: 'tabs',
      itemCount: raw.children.length,
    };
  }

  return undefined;
}

function detectFormPattern(raw: RawNodeData): PatternInfo | undefined {
  if (!raw.children || raw.children.length < 2) return undefined;

  const isVertical = raw.layoutMode === 'VERTICAL';

  let inputLikeCount = 0;
  let buttonLikeCount = 0;

  const checkNode = (node: RawNodeData) => {
    const name = node.name.toLowerCase();
    const hasBorder = node.strokes && node.strokes.length > 0;
    const hasRadius = node.cornerRadius && node.cornerRadius > 0;

    if (
      name.includes('input') ||
      name.includes('field') ||
      name.includes('text')
    ) {
      inputLikeCount++;
    } else if (hasBorder && hasRadius && node.children?.length === 1) {
      inputLikeCount++;
    }

    if (
      name.includes('button') ||
      name.includes('submit') ||
      name.includes('btn')
    ) {
      buttonLikeCount++;
    }
  };

  for (const child of raw.children) {
    checkNode(child);
    if (child.children) {
      for (const grandChild of child.children) {
        checkNode(grandChild);
      }
    }
  }

  if (isVertical && inputLikeCount >= 2 && buttonLikeCount >= 1) {
    return {
      pattern: 'form',
      itemCount: inputLikeCount + buttonLikeCount,
    };
  }

  return undefined;
}

function detectStepperPattern(raw: RawNodeData): PatternInfo | undefined {
  if (!raw.children || raw.children.length < 2) return undefined;

  const isHorizontal = raw.layoutMode === 'HORIZONTAL';

  let numberCount = 0;
  for (const child of raw.children) {
    if (child.type === 'TEXT' && child.characters) {
      const text = child.characters.trim();
      if (/^\d+$/.test(text) || /^step/i.test(text)) {
        numberCount++;
      }
    }
    if (child.children) {
      for (const grandChild of child.children) {
        if (grandChild.type === 'TEXT' && grandChild.characters) {
          const text = grandChild.characters.trim();
          if (/^\d+$/.test(text)) {
            numberCount++;
          }
        }
      }
    }
  }

  if (
    isHorizontal &&
    numberCount >= 2 &&
    raw.children.length >= 2 &&
    raw.children.length <= 7
  ) {
    return {
      pattern: 'stepper',
      itemCount: raw.children.length,
    };
  }

  return undefined;
}

export function detectPattern(raw: RawNodeData): PatternInfo | undefined {
  const nameHint = detectPatternFromName(raw.name);

  if (nameHint) {
    const baseInfo: PatternInfo = { pattern: nameHint };

    if (raw.children) {
      baseInfo.itemCount = raw.children.length;

      if (nameHint === 'grid' && raw.layoutWrap === 'WRAP') {
        const firstChild = raw.children[0];
        if (firstChild) {
          const gap = raw.itemSpacing ?? 0;
          const columns = Math.floor(
            (raw.width + gap) / (firstChild.width + gap)
          );
          baseInfo.columns = Math.max(1, columns);
          baseInfo.rows = Math.ceil(raw.children.length / baseInfo.columns);
        }
      }
    }

    return baseInfo;
  }

  const gridPattern = detectGridPattern(raw);
  if (gridPattern) return gridPattern;

  const carouselPattern = detectCarouselPattern(raw);
  if (carouselPattern) return carouselPattern;

  const tabsPattern = detectTabsPattern(raw);
  if (tabsPattern) return tabsPattern;

  const stepperPattern = detectStepperPattern(raw);
  if (stepperPattern) return stepperPattern;

  const formPattern = detectFormPattern(raw);
  if (formPattern) return formPattern;

  const listPattern = detectListPattern(raw);
  if (listPattern) return listPattern;

  return undefined;
}
