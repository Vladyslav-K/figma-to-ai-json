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
    _meta: {
      format:
        'Figma Export for Claude - JSON format for generating React/Tailwind code',
      types:
        'frame=container,text=text,img=image,rect=rectangle,' +
        'ellipse=circle/oval,vector=svg,group=group,instance=component instance',
      base:
        'w=width,h=height,minW/maxW=min/max-width,minH/maxH=min/max-height,' +
        'p=padding(number|[t,r,b,l]),gap=gap,layout=row|col,' +
        'justify=start|center|end|between,align=start|center|end|stretch,' +
        'wrap=flex-wrap,pos=abs|rel,x/y=position,bg=background,opacity=0-1,' +
        'radius=border-radius(number|[tl,tr,br,bl]),shadow=box-shadow,' +
        'blur=filter blur,overflow=hidden|scroll|visible,ch=children',
      text:
        'content=text,font=font-family,size=font-size(px),weight=font-weight,' +
        'color=text-color,lineH=line-height,letterS=letter-spacing,' +
        'textAlign=left|center|right|justify,' +
        'textDecor=underline|line-through|none,' +
        'textTransform=uppercase|lowercase|capitalize,truncate=text-overflow',
      image: 'src=image-url,fit=cover|contain|fill|none,alt=alt-text',
      border: 'border={w=width,c=color,style=solid|dashed|dotted}',
      tokens: '$cN=tokens.colors.cN,$fN=tokens.fonts.fN,$sN=tokens.shadows.sN',
      values: 'fill=100%/flex-1,hug=fit-content/auto,number=pixels',
    },
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
