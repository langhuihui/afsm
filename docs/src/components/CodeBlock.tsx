import { useState } from 'react';

const KW = new Set([
  'import', 'from', 'export', 'class', 'extends', 'return', 'async', 'await',
  'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'new',
  'this', 'super', 'true', 'false', 'null', 'undefined', 'void', 'typeof',
  'instanceof', 'in', 'of', 'as', 'interface', 'type', 'enum', 'implements',
  'public', 'private', 'protected', 'static', 'readonly', 'abstract', 'get',
  'set', 'try', 'catch', 'finally', 'throw', 'switch', 'case', 'default',
  'break', 'continue', 'yield', 'do'
]);

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(src: string): string {
  const out: string[] = [];
  let i = 0;
  const n = src.length;
  const pushRaw = (s: string) => out.push(escapeHtml(s));
  const pushSpan = (cls: string, s: string) => out.push(`<span class="${cls}">${escapeHtml(s)}</span>`);

  while (i < n) {
    const c = src[i];
    // line comment
    if (c === '/' && src[i + 1] === '/') {
      let j = i + 2;
      while (j < n && src[j] !== '\n') j++;
      pushSpan('afsm-tok-comment', src.slice(i, j));
      i = j;
      continue;
    }
    // block comment
    if (c === '/' && src[i + 1] === '*') {
      let j = i + 2;
      while (j < n && !(src[j] === '*' && src[j + 1] === '/')) j++;
      j = Math.min(n, j + 2);
      pushSpan('afsm-tok-comment', src.slice(i, j));
      i = j;
      continue;
    }
    // decorator
    if (c === '@') {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      pushSpan('afsm-tok-decorator', src.slice(i, j));
      i = j;
      continue;
    }
    // string
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === quote) { j++; break; }
        if (quote !== '`' && src[j] === '\n') break;
        j++;
      }
      pushSpan('afsm-tok-string', src.slice(i, j));
      i = j;
      continue;
    }
    // number
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) {
      let j = i;
      while (j < n && /[0-9a-fA-FxX._eE+-]/.test(src[j])) j++;
      pushSpan('afsm-tok-number', src.slice(i, j));
      i = j;
      continue;
    }
    // identifier / keyword
    if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      if (KW.has(word)) pushSpan('afsm-tok-keyword', word);
      else {
        let k = j;
        while (k < n && src[k] === ' ') k++;
        if (src[k] === '(') pushSpan('afsm-tok-function', word);
        else pushRaw(word);
      }
      i = j;
      continue;
    }
    pushRaw(c);
    i++;
  }
  return out.join('');
}

export interface CodeBlockProps {
  code: string;
  lang?: string;
}

export default function CodeBlock({ code, lang = 'typescript' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }
  return (
    <div className="max-h-[320px] overflow-auto rounded-md border border-afsm-line bg-black/40 font-afsm-mono text-[12.5px]">
      <div className="flex items-center justify-between border-b border-afsm-line bg-black/30 px-2.5 py-1 font-afsm-mono text-[11px] text-afsm-text-faint">
        <span>{lang}</span>
        <button className="afsm-btn-tiny" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="p-3">
        <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </pre>
    </div>
  );
}
