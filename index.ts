import EventEmitter from 'eventemitter3';
export interface IAFSM extends FSM {

}
const instance = Symbol('instance');
export type State = string | MiddleState;
// 中间过渡状态
export class MiddleState {
  constructor(public oldState: State, public newState: string, public action: string) {
  }
  toString() {
    return `${this.action}ing`;
  }
}
const stateDiagram = new Map<Object, { from: string | string[], to: string, action: string; }[]>();
export function ChangeState(from: string | string[], to: string) {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    if (!stateDiagram.has(target)) {
      stateDiagram.set(target, []);
      Object.defineProperty(target, 'stateDiagram', {
        get() {
          let result = new Set<string>();
          let plain: { from: string; to: string; action: string; }[] = [];
          let forceTo: { to: string; action: string; }[] = [];
          const stateConfig = stateDiagram.get(target)!;
          const allState = new Set();
          stateConfig.forEach(({ from, to, action }) => {
            if (typeof from === 'string') {
              plain.push({ from, to, action });
            } else {
              if (from.length) {
                from.forEach(f => {
                  plain.push({ from: f, to, action });
                });
              }
              else forceTo.push({ to, action });
            }
          });
          plain.forEach(({ from, to, action }) => {
            allState.add(from);
            allState.add(to);
            allState.add(action + "ing");
            result.add(`${from} --> ${action}ing : ${action}`);
            result.add(`${action}ing --> ${to} : ${action} 🟢`);
            result.add(`${action}ing --> ${from} : ${action} 🔴`);
          });
          forceTo.forEach(({ to, action }) => {
            result.add(`${action}ing --> ${to} : ${action} 🟢`);
            allState.forEach(f => {
              if (f !== to)
                result.add(`${f} --> ${action}ing : ${action}`);
            });
          });
          const parent = Object.getPrototypeOf(target);
          if (stateDiagram.has(parent)) {
            return [...parent.stateDiagram, ...result];
          }
          return [...result];
        }
      });
    }
    stateDiagram.get(target)!.push({ from, to, action: propertyKey.toString() });
    const origin = descriptor.value;
    descriptor.value = async function (this: IAFSM, ...arg: any[]) {
      if (this.state === to || typeof this.state != "string") throw FSM.ESTATE;
      if (Array.isArray(from)) {
        if (from.length == 0) {
          if (this.abortCtrl) this.abortCtrl.aborted = true;
        } else if ((!from.includes(this.state))) throw FSM.ESTATE;
      } else {
        if (from !== this.state) throw FSM.ESTATE;
      }
      const old = this.state;
      this.state = new MiddleState(old, to, propertyKey as string);
      const abort = { aborted: false };
      this.abortCtrl = abort;
      try {
        const result = await origin.apply(this, arg);
        if (abort.aborted) {
          throw FSM.EABORT;
        } else {
          this.abortCtrl = void 0;
        }
        this.state = to;
        return result;
      } catch (err) {
        this.state = old;
        throw err;
      }
    };
  };
}
//@ts-ignore
const hasDevTools = typeof window !== 'undefined' && window['__AFSM__'];
const inWorker = typeof importScripts !== 'undefined';
export class FSM extends EventEmitter {
  static STATECHANGED = 'stateChanged';
  static EABORT = new Error('abort');
  static ESTATE = new Error('wrong state');
  static INIT = "[*]";
  static ON = "on";
  static OFF = "off";

  get stateDiagram() {
    return [];
  }
  _state: State = FSM.INIT;
  abortCtrl?: { aborted: boolean; };
  constructor(public name?: string) {
    super();
    this.name = this.name || this.constructor.name;
    const names = Object.getPrototypeOf(this)[instance];
    if (!names) Object.getPrototypeOf(this)[instance] = { name: this.name, count: 0 };
    else this.name = names.name + "-" + names.count++;
    if (hasDevTools) window.dispatchEvent(new CustomEvent("createAFSM", { detail: { name: this.name, diagram: this.stateDiagram } }));
    else if (inWorker) postMessage({ type: 'createAFSM', payload: { name: this.name, diagram: this.stateDiagram } });
  }
  get state() {
    return this._state;
  }
  set state(value: State) {
    const old = this._state;
    this._state = value;
    const state = value.toString();
    if (value) this.emit(state, old);
    this.emit(FSM.STATECHANGED, value, old);
    if (hasDevTools) window.dispatchEvent(new CustomEvent("changeAFSM", { detail: { name: this.name, value, old } }));
    else if (inWorker) postMessage({ type: 'changeAFSM', payload: { name: this.name, value, old } });
  }
}