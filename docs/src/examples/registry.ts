import type { ExampleDef } from '../components/types';

export type { ExampleDef } from '../components/types';
export type { ParamSchema, LogFn, LogLevel } from '../components/types';

const examples: Record<string, ExampleDef> = {};

export function registerExample(def: ExampleDef) {
  examples[def.key] = def;
}

export function getExample(key: string): ExampleDef | undefined {
  return examples[key];
}

export function listExamples(): ExampleDef[] {
  return Object.values(examples);
}
