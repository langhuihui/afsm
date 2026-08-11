import { useState } from 'react';
import type { ParamSchema } from './types';
import { useLang } from './i18n';

export interface ParamControlProps {
  param: ParamSchema;
  value: number | boolean | string;
  onChange: (v: number | boolean | string) => void;
}

export default function ParamControl({ param, value, onChange }: ParamControlProps) {
  const lang = useLang();
  const label = lang.startsWith('zh') ? param.label.zh : param.label.en;
  // Fall back to the schema default when the value hasn't been initialized yet,
  // so inputs never flip between uncontrolled and controlled.
  const v = value ?? param.default;

  const fieldClass =
    'w-full rounded border border-afsm-line bg-afsm-panel px-2 py-1 text-afsm-text focus:border-afsm-accent focus:outline-none';

  return (
    <div className="flex flex-col gap-1 text-[13px]">
      <label className="flex items-center justify-between font-afsm-mono text-xs text-afsm-text-dim">
        <span>{label}</span>
        {param.type !== 'boolean' && <span className="font-semibold text-afsm-accent">{String(v)}</span>}
      </label>
      {param.type === 'slider' && (
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={v as number}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-afsm-accent"
        />
      )}
      {param.type === 'number' && (
        <input
          type="number"
          min={param.min}
          max={param.max}
          step={param.step}
          value={v as number}
          onChange={(e) => onChange(Number(e.target.value))}
          className={fieldClass}
        />
      )}
      {param.type === 'select' && (
        <select value={v as string} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
          {param.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
      {param.type === 'boolean' && (
        <input
          type="checkbox"
          checked={v as boolean}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-afsm-accent"
        />
      )}
    </div>
  );
}
