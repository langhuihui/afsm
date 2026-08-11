import type { TimelineItem } from './types';
import { t } from './i18n';

export interface TimelineProps {
  items: TimelineItem[];
}

function fmt(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function typeOf(it: TimelineItem): 'success' | 'error' | 'info' | 'default' {
  if (!it.action) return 'default';
  return it.processing ? 'info' : it.err ? 'error' : 'success';
}

const DOT: Record<'success' | 'error' | 'info' | 'default', string> = {
  success: 'before:bg-afsm-success before:shadow-[0_0_6px_var(--color-afsm-success)]',
  error: 'before:bg-afsm-error before:shadow-[0_0_6px_var(--color-afsm-error)]',
  info: 'before:bg-afsm-info before:shadow-[0_0_6px_var(--color-afsm-info)]',
  default: 'before:bg-[#6c6c80]'
};

export default function Timeline({ items }: TimelineProps) {
  const empty = t('暂无状态变更记录', 'No state changes yet');
  return (
    <div className="mt-1! max-h-[220px] overflow-auto border-l-2 border-afsm-line pl-3.5 font-afsm-mono text-[12.5px]">
      {items.length === 0 ? (
        <div className="py-2 font-afsm text-[13px] text-afsm-text-faint">{empty}</div>
      ) : (
        items.map((it, i) => (
          <div
            key={i}
            className={`relative flex items-baseline gap-2 py-[3px] pl-1.5 before:absolute before:left-[-19px] before:top-[10px] before:h-2 before:w-2 before:rounded-full before:content-[''] ${DOT[typeOf(it)]}`}
          >
            <span className="min-w-[70px] text-[11px] text-afsm-text-faint">{fmt(it.time)}</span>
            <span className="font-semibold text-afsm-text">{it.state}</span>
            {it.err && <span className="text-afsm-error">{it.err}</span>}
          </div>
        ))
      )}
    </div>
  );
}
