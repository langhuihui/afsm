import { useEffect, useRef, useState, useCallback } from 'react';
import StateDiagramView from './StateDiagramView';
import Timeline from './Timeline';
import type { TimelineItem, ConsoleLine, ExampleDef } from './types';
import ConsoleOut from './ConsoleOut';
import CodeBlock from './CodeBlock';
import ParamControl from './ParamControl';
import { useLang, tt, t } from './i18n';
import { listExamples, getExample } from '../examples';
import { FSM, MiddleState, type State, type IFSM } from 'afsm';

export interface EmbeddedPlaygroundProps {
  example?: string;
  autoRun?: boolean;
}

export default function EmbeddedPlayground({ example = 'traffic-light', autoRun = false }: EmbeddedPlaygroundProps) {
  const lang = useLang();
  const [allExamples, setAllExamples] = useState<ExampleDef[]>(() => listExamples());
  const [currentKey, setCurrentKey] = useState(example);
  // Initialize params synchronously from the example schema so the first render
  // already has values (prevents uncontrolled→controlled input warnings).
  const [params, setParams] = useState<Record<string, any>>(() => {
    const def = getExample(example);
    const next: Record<string, any> = {};
    if (def) for (const p of def.params) next[p.key] = p.default;
    return next;
  });
  const [history, setHistory] = useState<TimelineItem[]>([]);
  const [consoleLog, setConsoleLog] = useState<ConsoleLine[]>([]);
  const [diagram, setDiagram] = useState<string[]>([]);
  const [currentState, setCurrentState] = useState('');
  const [lastErr, setLastErr] = useState('');
  const [running, setRunning] = useState(false);

  const fsmRef = useRef<IFSM | null>(null);
  const timersRef = useRef<number[]>([]);

  const currentExample = getExample(currentKey);

  const initParams = useCallback((def: ExampleDef | undefined) => {
    const next: Record<string, any> = {};
    if (def) for (const p of def.params) next[p.key] = p.default;
    setParams(next);
  }, []);

  useEffect(() => {
    setAllExamples(listExamples());
    initParams(getExample(example));
    setCurrentKey(example);
  }, [example, initParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFsm();
    };
  }, []);

  const log = useCallback((level: string, ...args: any[]) => {
    const text = args
      .map((a) => (typeof a === 'string' ? a : typeof a === 'object' ? safeStringify(a) : String(a)))
      .join(' ');
    setConsoleLog((c) => [...c, { level: level as any, text, time: Date.now() }]);
  }, []);

  function safeStringify(o: any): string {
    try {
      return JSON.stringify(o);
    } catch {
      return String(o);
    }
  }

  function cleanupFsm() {
    if (fsmRef.current) {
      try {
        currentExample?.cleanup?.(fsmRef.current);
        fsmRef.current.removeAllListeners();
      } catch {}
    }
    for (const id of timersRef.current) {
      try {
        clearTimeout(id);
        clearInterval(id);
      } catch {}
    }
    timersRef.current = [];
    fsmRef.current = null;
  }

  function onStateChanged(newState: State, oldState: State, err?: any) {
    const time = Date.now();
    if (newState instanceof MiddleState) {
      setHistory((h) => [
        ...h,
        { time, state: newState.toString(), action: newState.action, processing: true }
      ]);
      setCurrentState(newState.toString());
    } else {
      let action = '';
      let processing = false;
      let errMsg: string | undefined;
      if (oldState instanceof MiddleState) {
        const success = oldState.newState === String(newState);
        action = `${oldState.action} ${success ? 'ok' : 'fail'}`;
        if (!success) errMsg = err?.message || String(err || '');
      }
      setHistory((h) => [
        ...h,
        { time, state: String(newState), action, processing, err: errMsg }
      ]);
      setCurrentState(String(newState));
      if (errMsg) setLastErr(errMsg);
    }
  }

  function run() {
    const def = currentExample;
    if (!def) return;
    cleanupFsm();
    setHistory([]);
    setConsoleLog([]);
    setLastErr('');
    setCurrentState('');
    setRunning(true);

    try {
      const inst = def.create({ ...params });
      fsmRef.current = inst;
      setDiagram([...inst.stateDiagram]);
      inst.on(FSM.STATECHANGED, onStateChanged as any);
      // Capture initial state
      setCurrentState(inst.state.toString());
      def.run(inst, { ...params }, log);
    } catch (e: any) {
      setConsoleLog((c) => [...c, { level: 'error', text: e?.message || String(e), time: Date.now() }]);
      setRunning(false);
    }
  }

  function reset() {
    cleanupFsm();
    setHistory([]);
    setConsoleLog([]);
    setCurrentState('');
    setLastErr('');
    setRunning(false);
  }

  // Auto-run on mount if requested
  useEffect(() => {
    if (autoRun && currentExample) {
      const timer = setTimeout(run, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, currentKey]);

  function onParamChange(key: string, v: any) {
    setParams((p) => ({ ...p, [key]: v }));
  }

  function exTitle(d?: ExampleDef) {
    return d ? (lang.startsWith('zh') ? d.title.zh : d.title.en) : '';
  }
  function exDesc(d?: ExampleDef) {
    return d ? (lang.startsWith('zh') ? d.description.zh : d.description.en) : '';
  }

  const stateColor = !currentState ? 'default' : currentState.endsWith('ing') ? 'info' : lastErr ? 'error' : currentState === '[*]' ? 'default' : 'success';
  const isProcessing = currentState.endsWith('ing');
  const stateDotCls =
    (stateColor === 'success' ? 'bg-afsm-success'
      : stateColor === 'error' ? 'bg-afsm-error'
      : stateColor === 'info' ? 'bg-afsm-info'
      : 'bg-[#6c6c80]') + (isProcessing ? ' animate-afsm-pulse' : '');

  const badgeCls = running
    ? 'border-afsm-success/30 bg-afsm-success/15 text-afsm-success'
    : 'border-afsm-line bg-afsm-accent/10 text-afsm-accent';

  if (!currentExample) {
    return (
      <div className="afsm-panel not-content my-4!">
        <div className="p-10 font-afsm-mono text-[13px] text-afsm-text-dim">{tt('notFound')}</div>
      </div>
    );
  }

  return (
    <div className="afsm-panel not-content my-4!">
      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-afsm-line bg-gradient-to-r from-afsm-accent/5 to-transparent px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 text-sm font-semibold leading-none text-afsm-accent">
          <span>Playground</span>
          <select
            className="h-7 rounded border border-afsm-line bg-afsm-panel px-2 pr-7 text-[13px] text-afsm-text focus:border-afsm-accent focus:outline-none"
            value={currentKey}
            onChange={(e) => {
              setCurrentKey(e.target.value);
              initParams(getExample(e.target.value));
              reset();
            }}
            aria-label={tt('choose')}
          >
            {allExamples.map((ex) => (
              <option key={ex.key} value={ex.key}>{lang.startsWith('zh') ? ex.title.zh : ex.title.en}</option>
            ))}
          </select>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-afsm-mono text-[10px] uppercase tracking-[0.06em] ${badgeCls}`}>
            {running ? tt('running') : tt('idle')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="afsm-btn afsm-btn-primary" onClick={run} disabled={!currentExample}>{tt('run')}</button>
          <button className="afsm-btn" onClick={reset} disabled={!fsmRef.current}>{tt('reset')}</button>
        </div>
      </div>
      <div className="grid min-h-[440px] grid-cols-2 max-[960px]:grid-cols-1">
        <div className="col-span-2 flex min-w-0 flex-col gap-2 overflow-auto border-b border-afsm-line p-3.5 max-[960px]:col-span-1 max-[960px]:border-b-0">
          <h4 className="afsm-section-label flex items-center gap-2">
            {tt('state')}
            {currentState && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-afsm-line bg-afsm-panel px-2.5 py-0.5 font-afsm-mono text-xs font-semibold">
                <span className={`inline-block h-2 w-2 rounded-full ${stateDotCls}`}></span>
                {currentState}
              </span>
            )}
          </h4>
          <StateDiagramView diagram={diagram} currentState={currentState} />
        </div>
        <div className="flex min-w-0 flex-col gap-3 overflow-auto border-r border-afsm-line p-3.5 max-[960px]:border-r-0 max-[960px]:border-b">
          <h4 className="afsm-section-label">{tt('params')}</h4>
          <div className="flex flex-col gap-3">
            {currentExample.params.length === 0 ? (
              <div className="py-2 font-afsm text-[13px] text-afsm-text-faint">{tt('noParams')}</div>
            ) : (
              currentExample.params.map((p) => (
                <ParamControl key={p.key} param={p} value={params[p.key]} onChange={(v) => onParamChange(p.key, v)} />
              ))
            )}
          </div>
          <h4 className="afsm-section-label">{tt('source')}</h4>
          <CodeBlock code={currentExample.source} lang="typescript" />
        </div>
        <div className="flex min-w-0 flex-col gap-3 overflow-auto p-3.5">
          <h4 className="afsm-section-label">{tt('timeline')}</h4>
          <Timeline items={history} />
          <h4 className="afsm-section-label">{tt('console')}</h4>
          <ConsoleOut lines={consoleLog} />
        </div>
      </div>
    </div>
  );
}
