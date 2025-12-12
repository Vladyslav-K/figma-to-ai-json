import { parseNode } from './parser';
import { transformTree } from './transformer';
import { optimizeTokens } from './tokens';
import type { ExportOptions, ExportResult, UIMessage } from './types';

const DEFAULT_OPTIONS: ExportOptions = {
  includeChildren: true,
  extractTokens: true,
  optimizeSize: true,
  maxDepth: 50,
};

async function exportSelection(
  options: ExportOptions
): Promise<ExportResult | null> {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    return null;
  }

  const node = selection[0];
  const rawData = await parseNode(node, options, 0);

  if (!rawData) {
    return null;
  }

  const { tree, tokens } = transformTree(rawData, options.extractTokens);

  return {
    v: '1.0',
    name: node.name,
    tokens: options.extractTokens
      ? optimizeTokens(tokens)
      : { colors: {}, fonts: {}, shadows: {} },
    tree,
  };
}

function sendToUI(message: UIMessage): void {
  figma.ui.postMessage(message);
}

figma.showUI(__html__, {
  width: 400,
  height: 600,
  themeColors: true,
});

figma.ui.onmessage = async (msg: {
  type: string;
  options?: Partial<ExportOptions>;
}) => {
  if (msg.type === 'export') {
    const options: ExportOptions = {
      ...DEFAULT_OPTIONS,
      ...msg.options,
    };

    try {
      const result = await exportSelection(options);

      if (!result) {
        sendToUI({
          type: 'error',
          error: 'Please select a frame or component to export.',
        });
        return;
      }

      const json = JSON.stringify(result, null, 2);

      sendToUI({
        type: 'export',
        data: result,
        json,
      });
    } catch (error) {
      sendToUI({
        type: 'error',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};

figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  figma.ui.postMessage({
    type: 'selection',
    hasSelection: selection.length > 0,
    selectionName: selection.length > 0 ? selection[0].name : null,
    selectionType: selection.length > 0 ? selection[0].type : null,
  });
});

const initialSelection = figma.currentPage.selection;
figma.ui.postMessage({
  type: 'selection',
  hasSelection: initialSelection.length > 0,
  selectionName: initialSelection.length > 0 ? initialSelection[0].name : null,
  selectionType: initialSelection.length > 0 ? initialSelection[0].type : null,
});
