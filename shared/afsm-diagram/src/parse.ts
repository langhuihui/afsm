export interface ParsedEdge {
  source: string;
  target: string;
  label: string;
}

/** Parse AFSM diagram lines `from --> to : label` into graph edges. */
export function parseEdges(diagram: string[]): ParsedEdge[] {
  const edges: ParsedEdge[] = [];
  for (const line of diagram) {
    const m = line.match(/^\s*(.+?)\s*-->\s*(.+?)(?:\s*:\s*(.*))?$/);
    if (!m) continue;
    edges.push({ source: m[1].trim(), target: m[2].trim(), label: (m[3] || '').trim() });
  }
  return edges;
}
