import EventEmitter from 'eventemitter3';
export interface IAFSM extends FSM {

}
const instance = Symbol('instance');
export type State = string | MiddleState;
// 中间过渡状态
export class MiddleState {
  error: any;
  constructor(public oldState: State, public newState: string, public action: string) {
  }
  toString() {
    return `${this.action}ing`;
  }
}
const stateDiagram = new Map<Object, { from: string | string[], to: string, action: string; }[]>();
export function ChangeState(from: string | string[], to: string) {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const action = propertyKey as string;
    if (!stateDiagram.has(target)) {
      stateDiagram.set(target, []);
      Object.defineProperty(target, 'stateDiagram', {
        configurable: true,
        get() {
          let result = new Set<string>();
          let plain: { from: string; to: string; action: string; }[] = [];
          let forceTo: { to: string; action: string; }[] = [];
          const stateConfig = stateDiagram.get(target)!;
          const allState = new Set();
          Object.defineProperty(target, 'allStates', { value: allState });
          const parent = Object.getPrototypeOf(target);
          if (stateDiagram.has(parent)) {
            parent.stateDiagram.forEach((stateDesc: string) => result.add(stateDesc));
            parent.allStates.forEach((state: string) => allState.add(state));
          }
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
          const value = [...result];
          Object.defineProperty(target, 'stateDiagram', { value });
          return value;
        }
      });
    }
    stateDiagram.get(target)!.push({ from, to, action });
    const origin = descriptor.value;
    descriptor.value = async function (this: IAFSM, ...arg: any[]) {
      // if (typeof this.state != "string") throw new Error(`${this.name} ${action} to ${to} faild: last action ${this.state.action} to ${this.state.newState} not complete`);
      if (this.state === to) return this._cacheResult;
      if (Array.isArray(from)) {
        if (from.length == 0) {
          if (this.abortCtrl) this.abortCtrl.aborted = true;
        } else if ((typeof this.state != "string" || !from.includes(this.state))) throw new Error(`${this.name} ${action} to ${to} faild: current state ${this._state} not in from config`);
      } else {
        if (from !== this.state) throw new Error(`${this.name} ${action} to ${to} faild: current state ${this._state} not from ${from}`);
      }
      const old = this.state;
      setState.call(this, new MiddleState(old, to, action));
      const abort = { aborted: false };
      this.abortCtrl = abort;
      try {
        this._cacheResult = await origin.apply(this, arg);
        if (abort.aborted) {
          return this._cacheResult;
        } else {
          this.abortCtrl = void 0;
        }
        setState.call(this, to);
        return this._cacheResult;
      } catch (err) {
        setState.call(this, old, String(err));
        throw err;
      }
    };
  };
}

//@ts-ignore
const hasDevTools = typeof window !== 'undefined' && window['__AFSM__'];
const inWorker = typeof importScripts !== 'undefined';
function setState(this: FSM, value: State, err?: any) {
  const old = this._state;
  this._state = value;
  const state = value.toString();
  if (value) this.emit(state, old);
  this.emit(FSM.STATECHANGED, value, old);
  const detail = { name: this.name, value, old, err };
  if (hasDevTools) window.dispatchEvent(new CustomEvent("changeAFSM", { detail }));
  else if (inWorker) postMessage({ type: 'changeAFSM', payload: detail });
}
export class FSM extends EventEmitter {
  get stateDiagram(): string[] {
    return [];
  }
  static STATECHANGED = 'stateChanged';
  static INIT = "[*]";//初始状态
  static ON = "on";
  static OFF = "off";
  _state: State = FSM.INIT;
  _cacheResult: any;
  abortCtrl?: { aborted: boolean; };
  constructor(public name?: string) {
    super();
    this.name = this.name || this.constructor.name;
    const prototype = Object.getPrototypeOf(this);
    const names = prototype[instance];
    if (!names) prototype[instance] = { name: this.name, count: 0 };
    else this.name = names.name + "-" + names.count++;
    if (hasDevTools) window.dispatchEvent(new CustomEvent("createAFSM", { detail: { name: this.name, diagram: this.stateDiagram } }));
    else if (inWorker) postMessage({ type: 'createAFSM', payload: { name: this.name, diagram: this.stateDiagram } });
  }
  get state() {
    return this._state;
  }
}