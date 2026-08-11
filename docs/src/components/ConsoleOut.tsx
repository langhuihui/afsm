import type { ConsoleLine } from './types';
import { t } from './i18n';

function fmt(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export interface ConsoleOutProps {
  lines: ConsoleLine[];
}

function lineColor(level: string): string {
  if (level === 'error') return 'text-afsm-error';
  if (level === 'warn') return 'text-afsm-warn';
  if (level === 'info') return 'text-afsm-info';
  return '';
}

export default function ConsoleOut({ lines }: ConsoleOutProps) {
  const empty = t('（无输出）', '(no output)');
  return (
    <div className="max-h-[140px] overflow-auto whitespace-pre-wrap rounded-md border border-afsm-line bg-black/40 px-2.5 py-2 font-afsm-mono text-xs text-afsm-text">
      {lines.length === 0 ? (
        <div className="text-afsm-text-faint">{empty}</div>
      ) : (
        lines.map((l, i) => (
          <div key={i} className={`flex gap-2 py-[1px] ${lineColor(l.level)}`}>
            <span className="shrink-0 text-afsm-text-faint">{fmt(l.time)}</span>
            <span className="min-w-0 break-words">{l.text}</span>
          </div>
        ))
      )}
    </div>
  );
}
