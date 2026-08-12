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

/** Skip string / template literals while scanning for matching braces. */
function skipString(src: string, i: number): number {
  const q = src[i];
  i++;
  while (i < src.length) {
    if (src[i] === '\\') {
      i += 2;
      continue;
    }
    if (src[i] === q) return i + 1;
    // template literals: skip ${...} with nested braces
    if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
      i += 2;
      let depth = 1;
      while (i < src.length && depth > 0) {
        if (src[i] === '"' || src[i] === "'" || src[i] === '`') {
          i = skipString(src, i);
          continue;
        }
        if (src[i] === '{') depth++;
        else if (src[i] === '}') depth--;
        i++;
      }
      continue;
    }
    i++;
  }
  return i;
}

/** Extract `{ ... }` body of `name(...) { ... }` inside an object literal. */
function extractMethodBody(objectSrc: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*\\([^)]*\\)\\s*\\{`);
  const m = objectSrc.match(re);
  if (!m || m.index === undefined) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < objectSrc.length && depth > 0) {
    const c = objectSrc[i];
    if (c === '"' || c === "'" || c === '`') {
      i = skipString(objectSrc, i);
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    i++;
  }
  return objectSrc.slice(start, i - 1).trim();
}

/**
 * Convert a preset's `?raw` source into a WebContainer-runnable main.ts:
 * strip registerExample boilerplate, keep the FSM class, wire bridge + create/run.
 */
export function exampleToMainTs(
  source: string,
  params: Record<string, unknown> = {}
): string {
  const trimmed = source.replace(/\nexport\s*\{\s*\};?\s*$/, '').trimEnd();
  const regIdx = trimmed.search(/\bregisterExample\s*\(/);
  const head = (regIdx >= 0 ? trimmed.slice(0, regIdx) : trimmed)
    .replace(/import\s*\{[^}]*\bregisterExample\b[^}]*\}\s*from\s*['"][^'"]+['"];?\s*/g, '')
    .replace(/import\s+source\s+from\s*['"][^'"]+['"];?\s*/g, '')
    .trim();

  let main = head;
  if (!/from\s*['"]\.\/bridge\.js['"]/.test(main)) {
    if (/^import\s/m.test(main)) {
      main = main.replace(
        /((?:^import\s[^;]+;\s*\n?)+)/m,
        (block) => `${block.replace(/\n?$/, '\n')}import { attachFSM, log } from './bridge.js';\n`
      );
    } else {
      main = `import { attachFSM, log } from './bridge.js';\n\n${main}`;
    }
  }

  const className = head.match(/\bclass\s+(\w+)/)?.[1];
  const regBlock = regIdx >= 0 ? trimmed.slice(regIdx) : '';
  const createBody = regBlock ? extractMethodBody(regBlock, 'create') : null;
  const runBody = regBlock ? extractMethodBody(regBlock, 'run') : null;

  main += '\n\n';
  main += `const params = ${JSON.stringify(params, null, 2)} as Record<string, any>;\n\n`;

  if (createBody) {
    main += `const fsm = (() => {\n${createBody}\n})();\n`;
  } else if (className) {
    main += `const fsm = new ${className}('demo');\n`;
  } else {
    return defaultMainTs;
  }

  main += 'attachFSM(fsm);\n';

  if (runBody) {
    main += `\n((fsm: any, params: Record<string, any>, log: typeof import('./bridge.js').log) => {\n${runBody}\n})(fsm, params, log);\n`;
  }

  return main;
}

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
