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
        'Figma Export for Claude - JSON format for generating React/Tailwind code. ' +
        'This format describes UI components with layout, styling, and semantic information.',
      types:
        'frame=div/section/container,text=p/span/h1-h6,img=img/Image,' +
        'rect=div with bg,ellipse=rounded-full div,vector=svg,' +
        'group=fragment/div,instance=reusable component',
      base:
        'w=width,h=height,minW/maxW=min/max-width,minH/maxH=min/max-height,' +
        'p=padding(number|[t,r,b,l]),gap=gap,layout=row|col(flex-direction),' +
        'justify=start|center|end|between(justify-content),' +
        'align=start|center|end|stretch(align-items),' +
        'wrap=flex-wrap,pos=abs|rel(position),x/y=left/top,' +
        'bg=background-color,opacity=opacity,radius=border-radius,' +
        'shadow=box-shadow,blur=backdrop-filter blur,' +
        'overflow=overflow,ch=children array,' +
        'backdropBlur=backdrop-blur,blendMode=mix-blend-mode,' +
        'rotate=transform rotate,aspectRatio=aspect-ratio,' +
        'zIndex=z-index,order=order,isFirst/isLast=:first/:last-child hints',
      text:
        'content=text content,font=font-family,size=font-size(px),' +
        'weight=font-weight(400-700),color=text-color,' +
        'lineH=line-height,letterS=letter-spacing,' +
        'textAlign=text-align,textDecor=text-decoration,' +
        'textTransform=text-transform,truncate=text-overflow ellipsis,' +
        'paragraphSpacing=margin-bottom for paragraphs,' +
        'autoResize=text box behavior,richText=mixed styles array',
      image:
        'src=placeholder(use imageRef for export),fit=object-fit,' +
        'alt=alt text,imageRef=Figma image hash for export API,' +
        'nodeId=Figma node ID for export,originalSize={w,h}=original dimensions,' +
        'cropRect={x,y,w,h}=crop area in 0-1 range',
      border:
        'border={w=border-width,c=border-color,style=solid|dashed|dotted}',
      tokens:
        '$cN=tokens.colors.cN(color reference),' +
        '$fN=tokens.fonts.fN(font reference),' +
        '$sN=tokens.shadows.sN(shadow reference)',
      values:
        'fill=w-full/flex-1,hug=w-fit/h-fit,' + 'number without unit=pixels',
      semantic:
        'semantic.role=HTML element hint(button/input/card/nav/header/footer/modal/badge/avatar/icon/link/list/listItem),' +
        'semantic.interactive=needs onClick/onHover,' +
        'semantic.state=component variant(default/hover/active/disabled/focus/selected)',
      interactions:
        'interactions=[{trigger,action,dest,url}] - prototype links for navigation logic,' +
        'trigger=click|hover|press,action=navigate|overlay|url,' +
        'dest=target page/component,url=external link',
      patterns:
        'patternInfo.pattern=UI pattern type for component choice,' +
        'grid=CSS Grid/flex-wrap,list=map() with items,' +
        'carousel=horizontal scroll/swiper,tabs=tab component,' +
        'form=form with inputs,itemCount/columns/rows=layout hints',
      responsive:
        'responsive.breakpoint=target screen size(mobile/tablet/desktop),' +
        'responsive.fluid=w-full needed,' +
        'responsive.grow=flex-grow,responsive.shrink=flex-shrink',
      devInfo:
        'devInfo.notes=designer notes from layer name [note: ...],' +
        'devInfo.description=component description from Figma,' +
        'devInfo.pluginData=data from other Figma plugins',
      tailwind:
        'Mapping guide: ' +
        'layout:row→flex flex-row,layout:col→flex flex-col,' +
        'justify:center→justify-center,justify:between→justify-between,' +
        'align:center→items-center,align:stretch→items-stretch,' +
        'w:fill→w-full/flex-1,h:hug→h-fit,' +
        'p:16→p-4,p:[16,24,16,24]→py-4 px-6,' +
        'gap:16→gap-4,radius:8→rounded-lg,radius:9999→rounded-full,' +
        'shadow→shadow-md/shadow-lg,blur:10→backdrop-blur-sm,' +
        'truncate:true→truncate,truncate:2→line-clamp-2,' +
        'pos:abs→absolute,overflow:hidden→overflow-hidden',
      react:
        'Component mapping: ' +
        'semantic.role:button→<button> or Button component,' +
        'semantic.role:input→<input> or Input component,' +
        'semantic.role:card→Card component with children,' +
        'semantic.role:link→<a> or Link component,' +
        'semantic.role:avatar→Avatar component,' +
        'semantic.role:badge→Badge component,' +
        'patternInfo.pattern:list→{items.map(item => ...)},' +
        'patternInfo.pattern:grid→grid grid-cols-{columns},' +
        'interactions.action:navigate→useRouter/Link,' +
        'interactions.action:url→<a href={url} target="_blank">,' +
        'instance with variantProps→pass as component props',
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
