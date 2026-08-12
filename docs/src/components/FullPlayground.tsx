import { useEffect, useRef, useState, useCallback } from 'react';
import StateDiagramView from './StateDiagramView';
import Timeline from './Timeline';
import type { TimelineItem, ConsoleLine } from './types';
import ConsoleOut from './ConsoleOut';
import { useLang, tt } from './i18n';
import { getExample, listExamples } from '../examples';
import { getWebContainer, isWebContainerSupported } from '../scripts/webcontainer';
import { buildVirtualFs, defaultMainTs, exampleToMainTs } from '../scripts/playground-template';
import { configureMonaco, monacoEditorOptions } from '../scripts/monaco-config';
// Side-effect: sets MonacoEnvironment BEFORE monaco-editor is imported below.
import '../scripts/monaco-env';

type WebContainer = any; // @webcontainer/api
type WCInstance = any;

interface BootState {
  status: 'idle' | 'booting' | 'mounting' | 'installing' | 'starting' | 'ready' | 'error';
  message?: string;
}

function mainTsForExample(key: string): string {
  const ex = getExample(key);
  if (!ex?.source) return defaultMainTs;
  const params: Record<string, unknown> = {};
  for (const p of ex.params) params[p.key] = p.default;
  return exampleToMainTs(ex.source, params);
}

export default function FullPlayground() {
  const lang = useLang();
  const [examples] = useState(() => listExamples());
  const [currentExampleKey, setCurrentExampleKey] = useState('traffic-light');
  const [editorValue, setEditorValue] = useState(() => mainTsForExample('traffic-light'));
  const [bootState, setBootState] = useState<BootState>({ status: 'idle' });
  const [history, setHistory] = useState<TimelineItem[]>([]);
  const [consoleLog, setConsoleLog] = useState<ConsoleLine[]>([]);
  const [diagram, setDiagram] = useState<string[]>([]);
  const [currentState, setCurrentState] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [running, setRunning] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const wcRef = useRef<WCInstance | null>(null);
  const devServerProcRef = useRef<any>(null);
  const installedRef = useRef(false);
  const listenersBoundRef = useRef(false);

  const supported = typeof window !== 'undefined' && isWebContainerSupported();

  const handleMessage = useCallback((e: MessageEvent) => {
    const data = e.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'afsm-state') {
      const newState = data.newState;
      const isMiddle = typeof newState === 'object' && newState?.__middle;
      const stateStr = isMiddle ? newState.toString : newState;
      setCurrentState(stateStr);
      const time = Date.now();
      let action = '';
      let processing = false;
      let errMsg: string | undefined;
      const oldState = data.oldState;
      if (typeof oldState === 'object' && oldState?.__middle) {
        const success = oldState.newState === stateStr;
        action = `${oldState.action} ${success ? 'ok' : 'fail'}`;
        if (!success) errMsg = data.err;
      }
      if (isMiddle) {
        action = newState.action;
        processing = true;
      }
      setHistory((h) => [...h, { time, state: stateStr, action, processing, err: errMsg }]);
    } else if (data.type === 'afsm-diagram') {
      setDiagram(data.diagram);
    } else if (data.type === 'afsm-log') {
      setConsoleLog((c) => [...c, { level: data.level, text: data.text, time: Date.now() }]);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Initialize Monaco on mount
  useEffect(() => {
    let cancelled = false;
    async function initMonaco() {
      if (!editorContainerRef.current) return;
      const monaco = await import('monaco-editor');
      if (cancelled) return;
      configureMonaco(monaco);
      monacoRef.current = monaco;
      editorRef.current = monaco.editor.create(editorContainerRef.current, {
        value: editorValue,
        language: 'typescript',
        ...monacoEditorOptions
      });
      editorRef.current.onDidChangeModelContent(() => {
        setEditorValue(editorRef.current.getValue());
      });
    }
    initMonaco();
    return () => {
      cancelled = true;
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  async function run() {
    if (!supported) return;
    setHistory([]);
    setConsoleLog([]);
    setCurrentState('');
    setDiagram([]);
    setRunning(true);
    try {
      const wc = await getWebContainer();
      wcRef.current = wc;
      setBootState({ status: 'mounting' });
      const fs = buildVirtualFs(editorValue);
      await wc.mount(fs);

      if (!installedRef.current) {
        setBootState({ status: 'installing', message: 'npm install...' });
        const installProc = await wc.spawn('npm', ['install']);
        await installProc.exit;
        installedRef.current = true;
      }

      setBootState({ status: 'starting', message: 'vite...' });
      // Kill any previous dev server
      if (devServerProcRef.current) {
        try { await devServerProcRef.current.kill(); } catch {}
      }
      const devProc = await wc.spawn('npm', ['run', 'dev']);
      devServerProcRef.current = devProc;

      if (!listenersBoundRef.current) {
        listenersBoundRef.current = true;
        wc.on('server-ready', (_port: number, url: string) => {
          setPreviewUrl(url);
          setBootState({ status: 'ready' });
        });
        wc.on('error', (err: { message: string }) => {
          setBootState({ status: 'error', message: err.message });
          setRunning(false);
        });
      }
    } catch (e: any) {
      setBootState({ status: 'error', message: e?.message || String(e) });
      setRunning(false);
    }
  }

  function reset() {
    setHistory([]);
    setConsoleLog([]);
    setCurrentState('');
    setDiagram([]);
    setPreviewUrl('');
    setBootState({ status: 'idle' });
    setRunning(false);
  }

  function loadExample(key: string) {
    setCurrentExampleKey(key);
    const code = mainTsForExample(key);
    setEditorValue(code);
    if (editorRef.current) editorRef.current.setValue(code);
  }

  function openInStackBlitz() {
    // StackBlitz SDK URL — opens a new project with the current code
    const params = new URLSearchParams({
      title: 'AFSM Playground',
      description: 'AFSM playground example'
    });
    window.open(`https://stackblitz.com/edit/afsm?${params}`, '_blank');
  }

  function fmtBootMessage() {
    const s = bootState;
    if (s.status === 'idle') return tt('idle');
    if (s.status === 'booting') return tt('booting');
    if (s.status === 'mounting') return lang.startsWith('zh') ? '正在挂载文件系统…' : 'Mounting filesystem...';
    if (s.status === 'installing') return s.message || 'npm install...';
    if (s.status === 'starting') return s.message || tt('runningDevServer');
    if (s.status === 'ready') return tt('ready');
    if (s.status === 'error') return `Error: ${s.message}`;
    return '';
  }

  const stateColor = !currentState ? 'default' : currentState.endsWith('ing') ? 'info' : currentState === '[*]' ? 'default' : 'success';
  const isProcessing = currentState.endsWith('ing');
  const stateDotCls =
    (stateColor === 'success' ? 'bg-afsm-success'
      : stateColor === 'error' ? 'bg-afsm-error'
      : stateColor === 'info' ? 'bg-afsm-info'
      : 'bg-[#6c6c80]') + (isProcessing ? ' animate-afsm-pulse' : '');

  const runningish = bootState.status === 'ready' || running;
  const badgeCls = runningish
    ? 'border-afsm-success/30 bg-afsm-success/15 text-afsm-success'
    : 'border-afsm-line bg-afsm-accent/10 text-afsm-accent';

  if (!supported) {
    return (
      <div className="afsm-panel not-content my-4!">
        <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-afsm-line px-3.5 py-2.5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-afsm-accent">
            <span>Full Playground</span>
            <span className="inline-flex items-center rounded-full border border-afsm-warn/30 bg-afsm-warn/15 px-2 py-0.5 font-afsm-mono text-[10px] uppercase text-afsm-warn">!</span>
          </div>
        </div>
        <div className="p-4 font-afsm-mono text-[13px] text-afsm-warn">
          {tt('unsupported')}
          <br /><br />
          <button className="afsm-btn afsm-btn-primary" onClick={openInStackBlitz}>↗ {tt('openInStackBlitz')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="afsm-panel not-content my-4!">
      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-afsm-line bg-gradient-to-r from-afsm-accent/5 to-transparent px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 text-sm font-semibold leading-none text-afsm-accent">
          <span>AFSM Playground</span>
          <select
            className="h-7 rounded border border-afsm-line bg-afsm-panel px-2 pr-7 text-[13px] text-afsm-text focus:border-afsm-accent focus:outline-none"
            value={currentExampleKey}
            onChange={(e) => loadExample(e.target.value)}
            aria-label={tt('choose')}
          >
            {examples.map((ex) => (
              <option key={ex.key} value={ex.key}>{lang.startsWith('zh') ? ex.title.zh : ex.title.en}</option>
            ))}
          </select>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-afsm-mono text-[10px] uppercase tracking-[0.06em] ${badgeCls}`}>
            {fmtBootMessage()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="afsm-btn afsm-btn-primary" onClick={run} disabled={bootState.status === 'booting' || bootState.status === 'mounting' || bootState.status === 'installing' || bootState.status === 'starting'}>{tt('run')}</button>
          <button className="afsm-btn" onClick={reset}>{tt('reset')}</button>
          <button className="afsm-btn" onClick={openInStackBlitz}>↗ {tt('openInStackBlitz')}</button>
        </div>
      </div>
      <div className="grid min-h-[600px] grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] max-[960px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-3 overflow-auto border-r border-afsm-line p-3.5 max-[960px]:border-r-0 max-[960px]:border-b">
          <h4 className="afsm-section-label">{tt('editAndRun')}</h4>
          <div ref={editorContainerRef} className="h-[500px] w-full overflow-hidden rounded-md border border-afsm-line" />
        </div>
        <div className="flex min-w-0 flex-col gap-3 overflow-auto p-3.5">
          <h4 className="afsm-section-label flex items-center gap-2">
            {tt('state')}
            {currentState && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-afsm-line bg-afsm-panel px-2.5 py-0.5 font-afsm-mono text-xs font-semibold">
                <span className={`inline-block h-2 w-2 rounded-full ${stateDotCls}`}></span>
                {currentState}
              </span>
            )}
          </h4>
          <h4 className="afsm-section-label">{tt('diagram')}</h4>
          <StateDiagramView diagram={diagram} currentState={currentState} />
          <h4 className="afsm-section-label">{tt('timeline')}</h4>
          <Timeline items={history} />
          <h4 className="afsm-section-label">{tt('console')}</h4>
          <ConsoleOut lines={consoleLog} />
        </div>
      </div>
    </div>
  );
}
