import { useEffect, useRef } from 'react';
import { createDiagram, syncDiagram, type DiagramTheme } from 'afsm-diagram';
import { useLang } from './i18n';

export interface StateDiagramViewProps {
  diagram: string[];
  currentState: string;
  theme?: DiagramTheme;
}

export default function StateDiagramView({
  diagram,
  currentState,
  theme = 'docs',
}: StateDiagramViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<ReturnType<typeof createDiagram> | null>(null);
  const sourceRef = useRef('');

  const lang = useLang();
  const emptyText = lang.startsWith('zh') ? '运行示例后此处显示状态图' : 'Run an example to see the state diagram';
  const hasDiagram = diagram.length > 0;

  useEffect(() => {
    if (!hasDiagram || !containerRef.current) return;
    const cy = createDiagram(containerRef.current, theme);
    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
      sourceRef.current = '';
    };
  }, [hasDiagram, theme]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !hasDiagram) return;
    syncDiagram(cy, diagram, currentState, sourceRef);
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
