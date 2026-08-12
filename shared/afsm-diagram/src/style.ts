import type { NodeSingular, StylesheetStyle } from 'cytoscape';

export type DiagramTheme = 'docs' | 'dark' | 'light';


interface ThemeColors {
  nodeBg: string;
  nodeBorder: string;
  nodeText: string;
  startFill: string;
  currentBg: string;
  currentBorder: string;
  processingBorder: string;
  edge: string;
  edgeArrow: string;
  edgeText: string;
  edgeTextOutline: string;
  fontFamily: string;
}

const THEMES: Record<DiagramTheme, ThemeColors> = {
  docs: {
    nodeBg: '#12121c',
    nodeBorder: '#00f0ff',
    nodeText: '#ffffff',
    startFill: '#00f0ff',
    currentBg: '#181826',
    currentBorder: '#00f0ff',
    processingBorder: '#ff00ea',
    edge: 'rgba(0, 240, 255, 0.55)',
    edgeArrow: 'rgba(0, 240, 255, 0.8)',
    edgeText: '#c0c0d0',
    edgeTextOutline: '#0a0a0f',
    fontFamily: 'JetBrains Mono',
  },
  dark: {
    nodeBg: '#1e1e1e',
    nodeBorder: '#4fc3f7',
    nodeText: '#e8e8e8',
    startFill: '#4fc3f7',
    currentBg: '#263238',
    currentBorder: '#4fc3f7',
    processingBorder: '#ce93d8',
    edge: 'rgba(79, 195, 247, 0.55)',
    edgeArrow: 'rgba(79, 195, 247, 0.85)',
    edgeText: '#b0b0b0',
    edgeTextOutline: '#121212',
    fontFamily: 'Menlo',
  },
  light: {
    nodeBg: '#ffffff',
    nodeBorder: '#1565c0',
    nodeText: '#1a1a1a',
    startFill: '#1565c0',
    currentBg: '#e3f2fd',
    currentBorder: '#1565c0',
    processingBorder: '#8e24aa',
    edge: 'rgba(21, 101, 192, 0.55)',
    edgeArrow: 'rgba(21, 101, 192, 0.85)',
    edgeText: '#455a64',
    edgeTextOutline: '#ffffff',
    fontFamily: 'Menlo',
  },
};

// Cytoscape style notes:
// - `font-family` only allows `[\w- "]` — no commas, so a single family.
// - `corner-radius` (not `border-radius`) rounds `round-rectangle` nodes.
// - Cytoscape has no `shadow-*`; the current/processing glow uses `outline-*`.
const nodeWidth = (n: NodeSingular) =>
  Math.max(110, String(n.data('label') ?? '').length * 9 + 40);

export function createStylesheet(theme: DiagramTheme = 'docs'): StylesheetStyle[] {
  const c = THEMES[theme];
  return [
    {
      selector: 'node',
      style: {
        'background-color': c.nodeBg,
        'border-color': c.nodeBorder,
        'border-width': 2,
        'border-opacity': 0.9,
        color: c.nodeText,
        label: 'data(label)',
        'font-family': c.fontFamily,
        'font-size': 18,
        'font-weight': 700,
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': 160,
        width: nodeWidth,
        height: 48,
        padding: 20,
        shape: 'round-rectangle',
        'corner-radius': 10,
        'background-opacity': 1,
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'node[isStart]',
      style: {
        shape: 'ellipse',
        width: 18,
        height: 18,
        'background-color': c.startFill,
        'border-width': 0,
        label: '',
      },
    },
    {
      selector: 'node.current',
      style: {
        'border-color': c.currentBorder,
        'border-width': 3,
        'border-opacity': 1,
        'background-color': c.currentBg,
        'outline-color': c.currentBorder,
        'outline-opacity': 0.8,
        'outline-width': 4,
        'outline-offset': 3,
      },
    },
    {
      selector: 'node.processing',
      style: {
        'border-color': c.processingBorder,
        'border-width': 3,
        'border-opacity': 1,
        'outline-color': c.processingBorder,
        'outline-opacity': 0.7,
        'outline-width': 4,
        'outline-offset': 3,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.5,
        'line-color': c.edge,
        'target-arrow-color': c.edgeArrow,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        label: 'data(label)',
        'font-family': c.fontFamily,
        'font-size': 10,
        color: c.edgeText,
        'text-outline-color': c.edgeTextOutline,
        'text-outline-width': 2,
        'text-rotation': 0,
        'text-margin-y': -6,
      },
    },
  ] as StylesheetStyle[];
}
