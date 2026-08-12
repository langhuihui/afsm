export interface TimelineItem {
  time: number;
  state: string;
  action: string;
  processing: boolean;
  err?: string;
}

export interface ConsoleLine {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
  time: number;
}

export interface ParamSchema {
  key: string;
  label: { zh: string; en: string };
  type: 'number' | 'slider' | 'boolean' | 'select';
  default: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface ExampleDef {
  key: string;
  source: string;
  params: ParamSchema[];
  create: (params: Record<string, any>) => any; // IFSM
  run: (fsm: any, params: Record<string, any>, log: LogFn) => void;
  cleanup?: (fsm: any) => void;
  title: { zh: string; en: string };
  description: { zh: string; en: string };
}

export type LogLevel = 'log' | 'info' | 'warn' | 'error';
export type LogFn = (level: LogLevel | string, ...args: any[]) => void;
