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
// Slugs omit the locale prefix; Starlight adds /zh or /en automatically.
const zhSidebar = [
  {
    label: '开始',
    items: [
      { label: '什么是 AFSM', slug: 'guide/what-is-afsm' },
      { label: '快速上手', slug: 'guide/getting-started' },
      { label: 'DevTools 扩展', slug: 'advanced/devtools', badge: '推荐' }
    ]
  },
  {
    label: '核心概念',
    items: [
      { label: '核心概念', slug: 'guide/core-concepts' },
      { label: '状态变更 @ChangeState', slug: 'guide/change-state' },
      { label: '其他装饰器', slug: 'guide/decorators' },
      { label: '事件系统', slug: 'guide/events' },
      { label: '错误处理', slug: 'guide/error-handling' },
      { label: '可视化状态图', slug: 'guide/visualization' }
    ]
  },
  {
    label: 'API 参考',
    items: [
      { label: '总览', slug: 'api' },
      { label: 'FSM 类', slug: 'api/fsm' },
      { label: '@ChangeState', slug: 'api/change-state' },
      { label: '@ActionState', slug: 'api/action-state' },
      { label: '@Includes / @Excludes', slug: 'api/includes-excludes' },
      { label: 'MiddleState', slug: 'api/middle-state' },
      { label: 'FSMError', slug: 'api/fsm-error' },
      { label: 'tryChangeState', slug: 'api/try-change-state' },
      { label: '类型定义', slug: 'api/types' }
    ]
  },
  {
    label: '示例',
    items: [
      { label: '总览', slug: 'examples' },
      { label: '连接管理', slug: 'examples/connection' },
      { label: '定时器 setTimeout', slug: 'examples/settimeout' },
      { label: '定时器 setInterval', slug: 'examples/setinterval' },
      { label: '红绿灯', slug: 'examples/traffic-light' },
      { label: '数据请求', slug: 'examples/data-fetch' }
    ]
  },
  {
    label: '进阶',
    items: [
      { label: '组合式状态机', slug: 'advanced/composition' },
      { label: '中断与 abort', slug: 'advanced/abort' },
      { label: '同步模式', slug: 'advanced/sync-mode' },
      { label: '继承', slug: 'advanced/inheritance' },
      { label: 'DevTools 扩展', slug: 'advanced/devtools' },
      { label: 'React 集成', slug: 'advanced/react-integration' },
      { label: 'Vue 集成', slug: 'advanced/vue-integration' },
      { label: 'Playground 工作原理', slug: 'advanced/playground-internals' }
    ]
  },
  {
    label: 'Playground',
    items: [
      { label: '在线 Playground', slug: 'playground', badge: 'new' }
    ]
  }
];

const enSidebar = [
  {
    label: 'Getting Started',
    items: [
      { label: 'What is AFSM', slug: 'guide/what-is-afsm' },
      { label: 'Quick Start', slug: 'guide/getting-started' },
      { label: 'DevTools Extension', slug: 'advanced/devtools', badge: 'recommended' }
    ]
  },
  {
    label: 'Core Concepts',
    items: [
      { label: 'Core Concepts', slug: 'guide/core-concepts' },
      { label: 'Changing State: @ChangeState', slug: 'guide/change-state' },
      { label: 'Other Decorators', slug: 'guide/decorators' },
      { label: 'Event System', slug: 'guide/events' },
      { label: 'Error Handling', slug: 'guide/error-handling' },
      { label: 'Visualizing the Diagram', slug: 'guide/visualization' }
    ]
  },
  {
    label: 'API Reference',
    items: [
      { label: 'Overview', slug: 'api' },
      { label: 'FSM Class', slug: 'api/fsm' },
      { label: '@ChangeState', slug: 'api/change-state' },
      { label: '@ActionState', slug: 'api/action-state' },
      { label: '@Includes / @Excludes', slug: 'api/includes-excludes' },
      { label: 'MiddleState', slug: 'api/middle-state' },
      { label: 'FSMError', slug: 'api/fsm-error' },
      { label: 'tryChangeState', slug: 'api/try-change-state' },
      { label: 'Types', slug: 'api/types' }
    ]
  },
  {
    label: 'Examples',
    items: [
      { label: 'Overview', slug: 'examples' },
      { label: 'Connection', slug: 'examples/connection' },
      { label: 'setTimeout Timer', slug: 'examples/settimeout' },
      { label: 'setInterval Timer', slug: 'examples/setinterval' },
      { label: 'Traffic Light', slug: 'examples/traffic-light' },
      { label: 'Data Fetch', slug: 'examples/data-fetch' }
    ]
  },
  {
    label: 'Advanced',
    items: [
      { label: 'Composing FSMs', slug: 'advanced/composition' },
      { label: 'Abort & Interruption', slug: 'advanced/abort' },
      { label: 'Sync Mode', slug: 'advanced/sync-mode' },
      { label: 'Inheritance', slug: 'advanced/inheritance' },
      { label: 'DevTools Extension', slug: 'advanced/devtools' },
      { label: 'React Integration', slug: 'advanced/react-integration' },
      { label: 'Vue Integration', slug: 'advanced/vue-integration' },
      { label: 'Playground Internals', slug: 'advanced/playground-internals' }
    ]
  },
  {
    label: 'Playground',
    items: [
      { label: 'Online Playground', slug: 'playground', badge: 'new' }
    ]
  }
];

export default defineConfig({
  site: 'https://afsm.langhuihui.com',
  // Keep /zh/... URLs; Starlight sets redirectToDefaultLocale: false, so map / explicitly.
  redirects: {
    '/': '/zh/'
  },
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
      description:
        'AFSM — Automatic Finite State Machine. Decorator-driven async state machines for TypeScript.',
      social: {
        github: 'https://github.com/langhuihui/afsm'
      },
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://afsm.langhuihui.com/home.png'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://afsm.langhuihui.com/home.png'
          }
        }
      ],
      customCss: ['./src/styles/dark-tech.css', './src/styles/global.css'],
      components: {
        PageFrame: './src/components/overrides/PageFrame.astro',
        Search: './src/components/overrides/SearchPlaceholder.astro',
        ContentPanel: './src/components/overrides/ContentPanel.astro',
        PageTitle: './src/components/overrides/PageTitle.astro',
        ThemeSelect: './src/components/overrides/ThemeSelect.astro'
      },
      defaultLocale: 'zh',
      locales: {
        // lang must match the locale key so Starlight's generated Astro i18n
        // defaultLocale aligns with the locale path (keeps URLs as /zh/...).
        zh: {
          label: '简体中文',
          lang: 'zh',
          sidebar: zhSidebar
        },
        en: {
          label: 'English',
          lang: 'en',
          sidebar: enSidebar
        }
      },
      tableOfContents: false,
      pagination: true
    }),
    mdx(),
    react()
  ],
  vite: {
    plugins: [tailwindcss(), coepForWorkers()],
    resolve: {
      // One React copy across the island graph (docs react + @astrojs/react/client).
      dedupe: ['react', 'react-dom'],
      alias: {
        'afsm-diagram': path.resolve(repoRoot, 'shared/afsm-diagram/src/index.ts')
      }
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
