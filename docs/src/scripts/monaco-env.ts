import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import 'monaco-editor/min/vs/editor/editor.main.css';

/**
 * Must run before `monaco-editor` is imported. Monaco reads
 * `globalThis.MonacoEnvironment` during module init; setting it afterwards
 * lets it fall back to AMD `require.toUrl`, which crashes under Vite ESM
 * (`Cannot read properties of undefined (reading 'toUrl')`).
 */
(globalThis as unknown as { MonacoEnvironment: { getWorker: (id: string, label: string) => Worker } }).MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  }
};
