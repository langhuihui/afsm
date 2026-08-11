import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

const docsRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(docsRoot, '..');

/** Module workers spawned from a COEP document must themselves be served with COEP. */
function coepForWorkers() {
  return {
    name: 'coep-for-workers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (
          url.includes('worker_file') ||
          url.includes('.worker') ||
          url.includes('monaco-editor')
        ) {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        }
        next();
      });
    }
  };
}

// Starlight sidebar definitions — shared structure, locale-specific labels.
const zhSidebar = [
  {
    label: '开始',
    items: [
      { label: '什么是 AFSM', slug: 'zh/guide/what-is-afsm' },
      { label: '快速上手', slug: 'zh/guide/getting-started' }
    ]
  },
  {
    label: '核心概念',
    items: [
      { label: '核心概念', slug: 'zh/guide/core-concepts' },
      { label: '状态变更 @ChangeState', slug: 'zh/guide/change-state' },
      { label: '其他装饰器', slug: 'zh/guide/decorators' },
      { label: '事件系统', slug: 'zh/guide/events' },
      { label: '错误处理', slug: 'zh/guide/error-handling' },
      { label: '可视化状态图', slug: 'zh/guide/visualization' }
    ]
  },
  {
    label: 'API 参考',
    items: [
      { label: '总览', slug: 'zh/api/' },
      { label: 'FSM 类', slug: 'zh/api/fsm' },
      { label: '@ChangeState', slug: 'zh/api/change-state' },
      { label: '@ActionState', slug: 'zh/api/action-state' },
      { label: '@Includes / @Excludes', slug: 'zh/api/includes-excludes' },
      { label: 'MiddleState', slug: 'zh/api/middle-state' },
      { label: 'FSMError', slug: 'zh/api/fsm-error' },
      { label: 'tryChangeState', slug: 'zh/api/try-change-state' },
      { label: '类型定义', slug: 'zh/api/types' }
    ]
  },
  {
    label: '示例',
    items: [
      { label: '总览', slug: 'zh/examples/' },
      { label: '连接管理', slug: 'zh/examples/connection' },
      { label: '定时器 setTimeout', slug: 'zh/examples/settimeout' },
      { label: '定时器 setInterval', slug: 'zh/examples/setinterval' },
      { label: '红绿灯', slug: 'zh/examples/traffic-light' },
      { label: '数据请求', slug: 'zh/examples/data-fetch' }
    ]
  },
  {
    label: '进阶',
    items: [
      { label: '组合式状态机', slug: 'zh/advanced/composition' },
      { label: '中断与 abort', slug: 'zh/advanced/abort' },
      { label: '同步模式', slug: 'zh/advanced/sync-mode' },
      { label: '继承', slug: 'zh/advanced/inheritance' },
      { label: 'DevTools 扩展', slug: 'zh/advanced/devtools' },
      { label: 'React 集成', slug: 'zh/advanced/react-integration' },
      { label: 'Vue 集成', slug: 'zh/advanced/vue-integration' },
      { label: 'Playground 工作原理', slug: 'zh/advanced/playground-internals' }
    ]
  },
  {
    label: 'Playground',
    items: [
      { label: '在线 Playground', slug: 'zh/playground', badge: 'new' }
    ]
  }
];

const enSidebar = [
  {
    label: 'Getting Started',
    items: [
      { label: 'What is AFSM', slug: 'en/guide/what-is-afsm' },
      { label: 'Quick Start', slug: 'en/guide/getting-started' }
    ]
  },
  {
    label: 'Core Concepts',
    items: [
      { label: 'Core Concepts', slug: 'en/guide/core-concepts' },
      { label: 'Changing State: @ChangeState', slug: 'en/guide/change-state' },
      { label: 'Other Decorators', slug: 'en/guide/decorators' },
      { label: 'Event System', slug: 'en/guide/events' },
      { label: 'Error Handling', slug: 'en/guide/error-handling' },
      { label: 'Visualizing the Diagram', slug: 'en/guide/visualization' }
    ]
  },
  {
    label: 'API Reference',
    items: [
      { label: 'Overview', slug: 'en/api/' },
      { label: 'FSM Class', slug: 'en/api/fsm' },
      { label: '@ChangeState', slug: 'en/api/change-state' },
      { label: '@ActionState', slug: 'en/api/action-state' },
      { label: '@Includes / @Excludes', slug: 'en/api/includes-excludes' },
      { label: 'MiddleState', slug: 'en/api/middle-state' },
      { label: 'FSMError', slug: 'en/api/fsm-error' },
      { label: 'tryChangeState', slug: 'en/api/try-change-state' },
      { label: 'Types', slug: 'en/api/types' }
    ]
  },
  {
    label: 'Examples',
    items: [
      { label: 'Overview', slug: 'en/examples/' },
      { label: 'Connection', slug: 'en/examples/connection' },
      { label: 'setTimeout Timer', slug: 'en/examples/settimeout' },
      { label: 'setInterval Timer', slug: 'en/examples/setinterval' },
      { label: 'Traffic Light', slug: 'en/examples/traffic-light' },
      { label: 'Data Fetch', slug: 'en/examples/data-fetch' }
    ]
  },
  {
    label: 'Advanced',
    items: [
      { label: 'Composing FSMs', slug: 'en/advanced/composition' },
      { label: 'Abort & Interruption', slug: 'en/advanced/abort' },
      { label: 'Sync Mode', slug: 'en/advanced/sync-mode' },
      { label: 'Inheritance', slug: 'en/advanced/inheritance' },
      { label: 'DevTools Extension', slug: 'en/advanced/devtools' },
      { label: 'React Integration', slug: 'en/advanced/react-integration' },
      { label: 'Vue Integration', slug: 'en/advanced/vue-integration' },
      { label: 'Playground Internals', slug: 'en/advanced/playground-internals' }
    ]
  },
  {
    label: 'Playground',
    items: [
      { label: 'Online Playground', slug: 'en/playground', badge: 'new' }
    ]
  }
];

export default defineConfig({
  site: 'https://afsm.dev',
  devToolbar: {
    enabled: false
  },
  integrations: [
    starlight({
      title: 'AFSM',
      logo: {
        src: './src/assets/logo.png',
        replacesTitle: false
      },
      description: 'Automatic Finite State Machine',
      social: {
        github: 'https://github.com/langhuihui/afsm'
      },
      customCss: ['./src/styles/dark-tech.css', './src/styles/global.css'],
      components: {
        PageFrame: './src/components/overrides/PageFrame.astro',
        Search: './src/components/overrides/SearchPlaceholder.astro',
        ContentPanel: './src/components/overrides/ContentPanel.astro',
        PageTitle: './src/components/overrides/PageTitle.astro',
        ThemeSelect: './src/components/overrides/ThemeSelect.astro'
      },
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
          sidebar: zhSidebar
        },
        en: {
          label: 'English',
          lang: 'en',
          sidebar: enSidebar
        }
      },
      editLink: {
        baseUrl: 'https://github.com/langhuihui/afsm/edit/main/docs'
      },
      lastUpdated: true,
      pagination: true
    }),
    mdx(),
    react()
  ],
  vite: {
    plugins: [tailwindcss(), coepForWorkers()],
    resolve: {
      // One React copy across the island graph (docs react + @astrojs/react/client).
      dedupe: ['react', 'react-dom']
    },
    server: {
      fs: {
        // Vite's default allow list only covers this package (`docs/`). Monaco's
        // CSS + fonts resolve through the pnpm store at `node_modules/.pnpm`,
        // which lives OUTSIDE `docs/`; without this the browser gets a 403 for
        // e.g. codicon.ttf.
        allow: [docsRoot, repoRoot]
      },
      headers: {
        // The /playground route is served with COEP: require-corp (see
        // middleware.ts) so WebContainer can run. Under COEP, Chrome requires
        // module worker scripts and their import graph to carry a
        // Cross-Origin-Resource-Policy header — same-origin works and keeps
        // this site self-contained (the worker files are same-origin @fs URLs).
        'Cross-Origin-Resource-Policy': 'same-origin'
      }
    },
    worker: {
      format: 'es'
    },
    // IMPORTANT: exclude `afsm` (a file:.. linked package) from Vite's dependency
    // pre-bundling. Pre-bundling a `file:`-linked package in dev can produce a
    // second copy of React inside the afsm prebundle chunk, which breaks React
    // hooks ("Cannot read properties of null (reading 'useState')").
    // `eventemitter3` (afsm's only dep) IS pre-bundled so Vite applies its
    // CJS→ESM default-export interop for afsm's `import EventEmitter from 'eventemitter3'`.
    // `react-dom/client` MUST be included — otherwise Vite loads the CJS entry
    // via `__require`, mixing production react-dom with dev react (DCE warning +
    // null dispatcher). Exclude monaco-editor so its AMD `toUrl` fallback is not
    // prebundled; workers are wired in monaco-env.ts instead.
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'eventemitter3'
      ],
      exclude: ['afsm', 'monaco-editor']
    }
  }
});
