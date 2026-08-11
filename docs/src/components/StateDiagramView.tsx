import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useLang } from './i18n';

cytoscape.use(dagre);

export interface StateDiagramViewProps {
  diagram: string[];
  currentState: string;
}

interface ParsedEdge {
  source: string;
  target: string;
  label: string;
}

/** Parse AFSM diagram lines `from --> to : label` into graph edges. */
function parseEdges(diagram: string[]): ParsedEdge[] {
  const edges: ParsedEdge[] = [];
  for (const line of diagram) {
    const m = line.match(/^\s*(.+?)\s*-->\s*(.+?)(?:\s*:\s*(.*))?$/);
    if (!m) continue;
    edges.push({ source: m[1].trim(), target: m[2].trim(), label: (m[3] || '').trim() });
  }
  return edges;
}

// Cytoscape style table. Notes on values that trip up its parser:
// - `font-family` only allows `[\w- "]` — no commas, so a single family.
// - `corner-radius` (not `border-radius`) rounds `round-rectangle` nodes.
// - Cytoscape has no `shadow-*`; the current/processing glow uses `outline-*`.
// - `width/height: 'label'` is deprecated; size from the label string instead.
const nodeWidth = (n: cytoscape.NodeSingular) =>
  Math.max(110, String(n.data('label') ?? '').length * 9 + 40);

const STYLE = [
  {
    selector: 'node',
    style: {
      'background-color': '#12121c',
      'border-color': '#00f0ff',
      'border-width': 2,
      'border-opacity': 0.9,
      color: '#ffffff',
      label: 'data(label)',
      'font-family': 'JetBrains Mono',
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
      'overlay-opacity': 0
    }
  },
  {
    // Start pseudo-state `[*]` renders as a small filled dot.
    selector: 'node[isStart]',
    style: {
      shape: 'ellipse',
      width: 18,
      height: 18,
      'background-color': '#00f0ff',
      'border-width': 0,
      label: ''
    }
  },
  {
    // Current (non-transition) state — solid cyan ring + glow outline.
    selector: 'node.current',
    style: {
      'border-color': '#00f0ff',
      'border-width': 3,
      'border-opacity': 1,
      'background-color': '#181826',
      'outline-color': '#00f0ff',
      'outline-opacity': 0.8,
      'outline-width': 4,
      'outline-offset': 3
    }
  },
  {
    // In-flight MiddleState (action ending in "ing") — magenta ring + glow outline.
    selector: 'node.processing',
    style: {
      'border-color': '#ff00ea',
      'border-width': 3,
      'border-opacity': 1,
      'outline-color': '#ff00ea',
      'outline-opacity': 0.7,
      'outline-width': 4,
      'outline-offset': 3
    }
  },
  {
    selector: 'edge',
    style: {
      width: 1.5,
      'line-color': 'rgba(0, 240, 255, 0.55)',
      'target-arrow-color': 'rgba(0, 240, 255, 0.8)',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      label: 'data(label)',
      'font-family': 'JetBrains Mono',
      'font-size': 10,
      color: '#c0c0d0',
      // Outline keeps labels legible WITHOUT the harsh dark rectangles.
      'text-outline-color': '#0a0a0f',
      'text-outline-width': 2,
      // Always horizontal so the diagram stays scannable in TB layout.
      'text-rotation': 0,
      'text-margin-y': -6
    }
  }
] as cytoscape.StylesheetStyle[];

function buildGraph(cy: cytoscape.Core, diagram: string[]) {
  const edges = parseEdges(diagram);
  const nodeIds = new Set<string>();
  for (const e of edges) {
    nodeIds.add(e.source);
    nodeIds.add(e.target);
  }
  const elements: cytoscape.ElementDefinition[] = [
    ...[...nodeIds].map((id) => ({
      data: { id, label: id, isStart: id === '[*]' }
    })),
    ...edges.map((e, i) => ({
      data: { id: `e${i}`, source: e.source, target: e.target, label: e.label }
    }))
  ];
  cy.elements().remove();
  cy.add(elements);
  // Force-directed (cose) layout: spreads nodes across 2D instead of a single
  // line, which suits cyclic/branching state machines. Nodes are pre-positioned
  // around a circle so the result is deterministic (randomize:false) and the
  // graph never jumps on re-render.
  const nodeCount = cy.nodes().length;
  const radius = Math.max(nodeCount * 60, 160);
  cy.nodes().forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodeCount;
    node.position({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  });
  cy.layout({
    name: 'cose',
    randomize: false,
    animate: false,
    fit: true,
    padding: 32,
    nodeRepulsion: 8000,
    idealEdgeLength: 100,
    edgeElasticity: 50,
    gravity: 0.4,
    numIter: 1000,
    nodeOverlap: 4
  } as any).run();
  cy.fit(undefined, 32);
}

function updateHighlight(cy: cytoscape.Core, currentState: string) {
  cy.nodes().forEach((n) => {
    if (n.id() === currentState) {
      n.addClass(currentState.endsWith('ing') ? 'processing' : 'current');
    } else {
      n.removeClass('current processing');
    }
  });
}

export default function StateDiagramView({ diagram, currentState }: StateDiagramViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const sourceRef = useRef('');

  const lang = useLang();
  const emptyText = lang.startsWith('zh') ? '运行示例后此处显示状态图' : 'Run an example to see the state diagram';
  const hasDiagram = diagram.length > 0;

  // Create the Cytoscape instance once the (conditionally rendered) container mounts.
  useEffect(() => {
    if (!hasDiagram || !containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      style: STYLE,
      layout: { name: 'preset' },
      minZoom: 0.1,
      maxZoom: 4
    });
    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
      sourceRef.current = '';
    };
  }, [hasDiagram]);

  // Rebuild the graph only when the diagram source changes; highlight the
  // current state on every change without touching the (stable) layout.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !hasDiagram) return;
    const key = diagram.join('\n');
    if (key !== sourceRef.current) {
      sourceRef.current = key;
      buildGraph(cy, diagram);
    }
    updateHighlight(cy, currentState);
  }, [diagram, currentState, hasDiagram]);

  if (!hasDiagram) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-md border border-afsm-line bg-black/20">
        <div className="font-afsm-mono text-[13px] text-afsm-text-faint">{emptyText}</div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-[460px] w-full rounded-md border border-afsm-line bg-black/20" />;
}
