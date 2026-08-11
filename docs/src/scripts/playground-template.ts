// The built AFSM library source (11KB ESM) — mounted into the WebContainer's
// node_modules/afsm/index.js to skip `npm install` entirely.
import afsmSource from '../../../index.js?raw';

/**
 * The bridge script injected into the WebContainer preview iframe.
 * Wraps FSM construction so that STATECHANGED events are forwarded to the
 * parent window via postMessage.
 */
const bridgeSource = `
// Bridge: forwards FSM STATECHANGED events from the WebContainer iframe to the parent window.
window.addEventListener('message', (e) => {
  if (e.data?.type === 'afsm-run') {
    window.__afsmParams = e.data.params || {};
  }
});

export function attachFSM(fsm) {
  fsm.on(fsm.constructor.STATECHANGED || 'stateChanged', (newState, oldState, err) => {
    const serialize = (s) => {
      if (s === null || s === undefined) return s;
      if (typeof s === 'string') return s;
      if (typeof s === 'object' && s.action !== undefined && s.newState !== undefined) {
        return {
          __middle: true,
          oldState: serialize(s.oldState),
          newState: s.newState,
          action: s.action,
          aborted: !!s.aborted,
          toString: typeof s.toString === 'function' ? s.toString() : s.action + 'ing'
        };
      }
      return String(s);
    };
    parent.postMessage({
      type: 'afsm-state',
      newState: serialize(newState),
      oldState: serialize(oldState),
      err: err instanceof Error ? err.message : err ? String(err) : undefined
    }, '*');
  });
  // Send initial state + diagram
  parent.postMessage({
    type: 'afsm-state',
    newState: serializeState(fsm.state),
    oldState: serializeState(fsm.state),
    err: undefined
  }, '*');
  if (fsm.stateDiagram) {
    parent.postMessage({
      type: 'afsm-diagram',
      diagram: [...fsm.stateDiagram]
    }, '*');
  }
  function serializeState(s) {
    if (s === null || s === undefined) return s;
    if (typeof s === 'string') return s;
    if (typeof s === 'object' && s.action !== undefined) {
      return { __middle: true, action: s.action, newState: s.newState, toString: s.toString() };
    }
    return String(s);
  }
}

export function log(level, ...args) {
  const text = args.map((a) => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  parent.postMessage({ type: 'afsm-log', level: level || 'log', text }, '*');
}
`;

/**
 * The default main.ts template shown in the Monaco editor. Users can edit this.
 * It imports the bridge, defines an FSM, constructs it, attaches the bridge,
 * and runs a demo sequence.
 */
export const defaultMainTs = `import { FSM, ChangeState } from 'afsm';
import { attachFSM, log } from './bridge.js';

// Edit me! Define your FSM below.
class TrafficLight extends FSM {
  @ChangeState(FSM.INIT, 'red')
  async init() {}

  @ChangeState('red', 'green')
  async go() {
    setTimeout(() => this.warn(), 2000);
  }

  @ChangeState('green', 'yellow')
  async warn() {
    setTimeout(() => this.stop(), 1000);
  }

  @ChangeState('yellow', 'red')
  async stop() {
    setTimeout(() => this.go(), 2000);
  }
}

const fsm = new TrafficLight('demo');
attachFSM(fsm);
log('info', 'starting traffic light');
fsm.init().then(() => fsm.go());
`;

/** The vite config for the WebContainer project. */
const viteConfig = `import { defineConfig } from 'vite';

export default defineConfig({
  server: { host: true }
});
`;

/** The package.json for the WebContainer project. */
const packageJson = `{
  "name": "afsm-playground",
  "type": "module",
  "private": true,
  "scripts": { "dev": "vite" },
  "dependencies": {
    "afsm": "file:./afsm-local",
    "eventemitter3": "^4.0.7"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.4.0"
  }
}
`;

/** The afsm-local package.json (so file:./afsm-local resolves) */
const afsmLocalPackageJson = `{
  "name": "afsm",
  "version": "2.4.9",
  "type": "module",
  "main": "index.js"
}
`;

/** The tsconfig.json for the WebContainer project (experimentalDecorators!) */
const tsconfigJson = `{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  }
}
`;

/** index.html for the WebContainer vite project. */
const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>AFSM Playground Preview</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/main.ts"></script>
</body>
</html>
`;

/** WebContainer FileSystemTree: files must be `{ file: { contents } }`, not raw strings. */
type FileNode = { file: { contents: string } };
type DirNode = { directory: VirtualFs };
export interface VirtualFs {
  [path: string]: FileNode | DirNode;
}

function file(contents: string): FileNode {
  return { file: { contents } };
}

/** Build the virtual filesystem tree to mount into the WebContainer. */
export function buildVirtualFs(mainTs: string): VirtualFs {
  return {
    'package.json': file(packageJson),
    'vite.config.js': file(viteConfig),
    'tsconfig.json': file(tsconfigJson),
    'index.html': file(indexHtml),
    'main.ts': file(mainTs),
    'bridge.js': file(bridgeSource),
    'afsm-local': {
      directory: {
        'package.json': file(afsmLocalPackageJson),
        'index.js': file(afsmSource)
      }
    }
  };
}
