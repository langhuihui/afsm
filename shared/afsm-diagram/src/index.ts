import cytoscape, { type Core } from 'cytoscape';
import { createStylesheet, type DiagramTheme } from './style';
import { buildGraph, updateHighlight } from './graph';

export type { ParsedEdge } from './parse';
export { parseEdges } from './parse';
export type { DiagramTheme } from './style';
export { createStylesheet } from './style';
export { buildGraph, updateHighlight } from './graph';

export function createDiagram(
  container: HTMLElement,
  theme: DiagramTheme = 'docs',
): Core {
  return cytoscape({
    container,
    style: createStylesheet(theme),
    layout: { name: 'preset' },
    minZoom: 0.1,
    maxZoom: 4,
  });
}

/** Apply diagram source and/or highlight; rebuild layout only when source changes. */
export function syncDiagram(
  cy: Core,
  diagram: string[],
  currentState: string,
  sourceKey: { current: string },
) {
  const key = diagram.join('\n');
  if (key !== sourceKey.current) {
    sourceKey.current = key;
    buildGraph(cy, diagram);
  }
  updateHighlight(cy, currentState);
}
