import { useState, useEffect } from 'react';

/** Returns the current locale language code (e.g. 'zh-CN' or 'en'). */
export function useLang(): string {
  const [lang, setLang] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.lang || 'en';
    }
    return 'en';
  });
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setLang(document.documentElement.lang || 'en');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);
  return lang;
}

export function t(zh: string, en: string): string {
  // Simple synchronous version — use in render where the hook value is already current.
  const lang = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en';
  return lang.startsWith('zh') ? zh : en;
}

export const i18n = {
  run: { zh: '运行', en: 'Run' },
  reset: { zh: '重置', en: 'Reset' },
  params: { zh: '参数', en: 'Parameters' },
  source: { zh: '源代码', en: 'Source' },
  timeline: { zh: '时间线', en: 'Timeline' },
  console: { zh: '控制台', en: 'Console' },
  wcLogs: { zh: 'WebContainer 日志', en: 'WebContainer Logs' },
  state: { zh: '当前状态', en: 'Current State' },
  diagram: { zh: '状态图', en: 'State Diagram' },
  idle: { zh: '空闲', en: 'idle' },
  running: { zh: '运行中', en: 'running' },
  choose: { zh: '选择示例', en: 'Choose example' },
  noParams: { zh: '此示例无参数', en: 'No parameters' },
  notFound: { zh: '未找到示例', en: 'Example not found' },
  noOutput: { zh: '（无输出）', en: '(no output)' },
  noChanges: { zh: '暂无状态变更记录', en: 'No state changes yet' },
  unsupported: {
    zh: 'WebContainer 需要页面处于跨源隔离状态（服务器须发送 COOP / COEP 响应头）。本地请用 pnpm docs:dev 运行；部署到 Netlify / Cloudflare Pages 会自动应用 _headers。您也可以点击下方按钮在 StackBlitz 中打开。',
    en: 'WebContainer requires cross-origin isolation (the server must send COOP / COEP headers). Run pnpm docs:dev locally, or deploy to Netlify / Cloudflare Pages which applies _headers automatically. You can also open this in StackBlitz below.'
  },
  openInStackBlitz: { zh: '在 StackBlitz 中打开', en: 'Open in StackBlitz' },
  booting: { zh: '正在启动 WebContainer…', en: 'Booting WebContainer…' },
  runningDevServer: { zh: '正在启动开发服务器…', en: 'Starting dev server…' },
  ready: { zh: '就绪', en: 'ready' },
  copy: { zh: '复制', en: 'Copy' },
  copied: { zh: '已复制', en: 'Copied' },
  editAndRun: {
    zh: '编辑代码后点击运行，实时观察状态机变化',
    en: 'Edit the code and click Run to see the state machine in action'
  }
} as const;

export type I18nKey = keyof typeof i18n;

export function tt(key: I18nKey): string {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en';
  return lang.startsWith('zh') ? i18n[key].zh : i18n[key].en;
}
