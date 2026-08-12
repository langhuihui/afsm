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

// Starlight only reads top-level `sidebar` (locale.sidebar is stripped by Zod).
// Use `translations` for zh/en labels. Slugs omit the locale prefix.
const sidebar = [
  {
    label: 'Getting Started',
    translations: { zh: '开始' },
    items: [
      { label: 'What is AFSM', translations: { zh: '什么是 AFSM' }, slug: 'guide/what-is-afsm' },
      { label: 'Quick Start', translations: { zh: '快速上手' }, slug: 'guide/getting-started' },
      {
        label: 'DevTools Extension',
        translations: { zh: 'DevTools 扩展' },
        slug: 'advanced/devtools',
        badge: { text: { en: 'Recommended', zh: '推荐' }, variant: 'tip' }
      }
    ]
  },
  {
    label: 'Core Concepts',
    translations: { zh: '核心概念' },
    items: [
      { label: 'Core Concepts', translations: { zh: '核心概念' }, slug: 'guide/core-concepts' },
      { label: 'Changing State: @ChangeState', translations: { zh: '状态变更 @ChangeState' }, slug: 'guide/change-state' },
      { label: 'Other Decorators', translations: { zh: '其他装饰器' }, slug: 'guide/decorators' },
      { label: 'Event System', translations: { zh: '事件系统' }, slug: 'guide/events' },
      { label: 'Error Handling', translations: { zh: '错误处理' }, slug: 'guide/error-handling' },
      { label: 'Visualizing the Diagram', translations: { zh: '可视化状态图' }, slug: 'guide/visualization' }
    ]
  },
  {
    label: 'API Reference',
    translations: { zh: 'API 参考' },
    items: [
      { label: 'Overview', translations: { zh: '总览' }, slug: 'api' },
      { label: 'FSM Class', translations: { zh: 'FSM 类' }, slug: 'api/fsm' },
      { label: '@ChangeState', slug: 'api/change-state' },
      { label: '@ActionState', slug: 'api/action-state' },
      { label: '@Includes / @Excludes', slug: 'api/includes-excludes' },
      { label: 'MiddleState', slug: 'api/middle-state' },
      { label: 'FSMError', slug: 'api/fsm-error' },
      { label: 'tryChangeState', slug: 'api/try-change-state' },
      { label: 'Types', translations: { zh: '类型定义' }, slug: 'api/types' }
    ]
  },
  {
    label: 'Examples',
    translations: { zh: '示例' },
    items: [
      { label: 'Overview', translations: { zh: '总览' }, slug: 'examples' },
      { label: 'Connection', translations: { zh: '连接管理' }, slug: 'examples/connection' },
      { label: 'setTimeout Timer', translations: { zh: '定时器 setTimeout' }, slug: 'examples/settimeout' },
      { label: 'setInterval Timer', translations: { zh: '定时器 setInterval' }, slug: 'examples/setinterval' },
      { label: 'Traffic Light', translations: { zh: '红绿灯' }, slug: 'examples/traffic-light' },
      { label: 'Data Fetch', translations: { zh: '数据请求' }, slug: 'examples/data-fetch' }
    ]
  },
  {
    label: 'Advanced',
    translations: { zh: '进阶' },
    items: [
      { label: 'Composing FSMs', translations: { zh: '组合式状态机' }, slug: 'advanced/composition' },
      { label: 'Abort & Interruption', translations: { zh: '中断与 abort' }, slug: 'advanced/abort' },
      { label: 'Sync Mode', translations: { zh: '同步模式' }, slug: 'advanced/sync-mode' },
      { label: 'Inheritance', translations: { zh: '继承' }, slug: 'advanced/inheritance' },
      { label: 'React Integration', translations: { zh: 'React 集成' }, slug: 'advanced/react-integration' },
      { label: 'Vue Integration', translations: { zh: 'Vue 集成' }, slug: 'advanced/vue-integration' },
      { label: 'Playground Internals', translations: { zh: 'Playground 工作原理' }, slug: 'advanced/playground-internals' }
    ]
  },
  {
    label: 'Playground',
    items: [
      {
        label: 'Online Playground',
        translations: { zh: '在线 Playground' },
        slug: 'playground',
        badge: { text: 'New', variant: 'success' }
      }
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
        ThemeSelect: './src/components/overrides/ThemeSelect.astro',
        // Force dark always — EC code blocks follow data-theme, not our page CSS.
        ThemeProvider: './src/components/overrides/ThemeProvider.astro'
      },
      defaultLocale: 'zh',
      locales: {
        // lang must match the locale key so Starlight's generated Astro i18n
        // defaultLocale aligns with the locale path (keeps URLs as /zh/...).
        zh: {
          label: '简体中文',
          lang: 'zh'
        },
        en: {
          label: 'English',
          lang: 'en'
        }
      },
      sidebar,
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
      dedupe: ['react', 'react-dom']
      // Do NOT alias `afsm-diagram` to its source path: Vite then resolves
      // `cytoscape` from `shared/afsm-diagram/`, which has no node_modules on
      // Vercel (only docs/ is installed). Let the file: package link resolve
      // so cytoscape comes from docs' pnpm store.
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
