/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare type FSMStateInfo = { time: number, state: string, err?: string, action: string, processing: boolean, note: string; };
declare type FSMInfoGroup = { name: string, children: FSMInfo[]; };
declare type FSMInfo = { name: string, diagram: string[], state: FSMStateInfo, history: FSMStateInfo[]; };