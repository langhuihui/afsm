import type { languages } from 'monaco-editor';

/** Monaco TypeScript compiler options for AFSM (decorators + legacy class fields). */
export const monacoTsCompilerOptions: languages.typescript.CompilerOptions = {
  experimentalDecorators: true,
  useDefineForClassFields: false,
  target: 2, // ES2020
  module: 1, // ESNext
  moduleResolution: 2, // bundler
  strict: true,
  skipLibCheck: true,
  esModuleInterop: true,
  allowNonTsExtensions: true,
  jsx: 0 // off
};

/** Monaco editor options for the playground. */
export const monacoEditorOptions = {
  theme: 'afsm-dark',
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on' as const,
  tabSize: 2,
  automaticLayout: true,
  wordWrap: 'on' as const,
  smoothScrolling: true,
  cursorBlinking: 'smooth' as const,
  renderLineHighlight: 'all' as const,
  scrollbar: {
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8
  }
};

/** Define the custom dark theme + compiler options on a Monaco instance. */
export function configureMonaco(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme('afsm-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'c792ea', fontStyle: 'italic' },
      { token: 'string', foreground: 'c3e88d' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'comment', foreground: '546e7a', fontStyle: 'italic' },
      { token: 'delimiter', foreground: '89ddff' },
      { token: 'identifier', foreground: 'e4e4ef' },
      { token: 'type', foreground: 'ffcb6b' },
      { token: 'delimiter.bracket', foreground: '89ddff' },
      { token: 'delimiter.array', foreground: '89ddff' },
      { token: 'delimiter.parenthesis', foreground: '89ddff' }
    ],
    colors: {
      'editor.background': '#0a0a0f',
      'editor.foreground': '#e4e4ef',
      'editor.lineHighlightBackground': '#181826',
      'editor.selectionBackground': '#00f0ff33',
      'editor.inactiveSelectionBackground': '#00f0ff22',
      'editorLineNumber.foreground': '#4a4a5c',
      'editorLineNumber.activeForeground': '#00f0ff',
      'editorCursor.foreground': '#00f0ff',
      'editorIndentGuide.background': '#1a1a26',
      'editorIndentGuide.activeBackground': '#2a2a3a',
      'editorWidget.background': '#12121c',
      'editorWidget.border': '#00f0ff33',
      'editorSuggestWidget.background': '#12121c',
      'editorSuggestWidget.selectedBackground': '#00f0ff22',
      'editorSuggestWidget.border': '#00f0ff33',
      'editorHoverWidget.background': '#12121c',
      'editorHoverWidget.border': '#00f0ff33',
      'scrollbarSlider.background': '#00f0ff33',
      'scrollbarSlider.hoverBackground': '#00f0ff55',
      'scrollbarSlider.activeBackground': '#00f0ff77'
    }
  });

  // Configure TypeScript compiler options for decorator support
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
    monacoTsCompilerOptions
  );
  // Enable diagnostics
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false
  });
}
