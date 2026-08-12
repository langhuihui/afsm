import type { Core, ElementDefinition, NodeSingular } from 'cytoscape';
import { parseEdges } from './parse';

export function buildGraph(cy: Core, diagram: string[]) {
  const edges = parseEdges(diagram);
  const nodeIds = new Set<string>();
  for (const e of edges) {
    nodeIds.add(e.source);
    nodeIds.add(e.target);
  }
  const elements: ElementDefinition[] = [
    ...[...nodeIds].map((id) => ({
      data: { id, label: id, isStart: id === '[*]' },
    })),
    ...edges.map((e, i) => ({
      data: { id: `e${i}`, source: e.source, target: e.target, label: e.label },
    })),
  ];
  cy.elements().remove();
  cy.add(elements);
  // Force-directed (cose) layout: spreads nodes across 2D instead of a single
  // line, which suits cyclic/branching state machines. Nodes are pre-positioned
  // around a circle so the result is deterministic (randomize:false) and the
  // graph never jumps on re-render.
  const nodeCount = cy.nodes().length;
  const radius = Math.max(nodeCount * 60, 160);
  cy.nodes().forEach((node: NodeSingular, i: number) => {
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
    nodeOverlap: 4,
  } as any).run();
  cy.fit(undefined, 32);
}

export function updateHighlight(cy: Core, currentState: string) {
  cy.nodes().forEach((n: NodeSingular) => {
    if (n.id() === currentState) {
      n.addClass(currentState.endsWith('ing') ? 'processing' : 'current');
    } else {
      n.removeClass('current processing');
    }
  });
}
