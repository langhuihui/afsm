import EventEmitter from 'eventemitter3';
export interface IAFSM extends FSM {

}
const instance = Symbol('instance');
const abortCtrl = Symbol('abortCtrl');
const cacheResult = Symbol('cacheResult');
export type State = string | MiddleState;
export interface ChangeOption {
  ignoreError?: boolean;
}
// 中间过渡状态
export class MiddleState {
  error: any;
  constructor(public oldState: State, public newState: string, public action: string) {
  }
  toString() {
    return `${this.action}ing`;
  }
}
export class FSMError extends Error {
  constructor(public state: State, public message: string, public cause?: Error) {
    super(message);
  }
}
const stateDiagram = new Map<Object, { from: string | string[], to: string, action: string; }[]>();
const originPromise = Object.getPrototypeOf((async () => { })()).constructor;
export function ChangeState(from: string | string[], to: string, opt: ChangeOption = {}) {
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
      if (this.state === to) return this[cacheResult];
      let err: Error | null = null;
      if (Array.isArray(from)) {
        if (from.length == 0) {
          if (this[abortCtrl]) this[abortCtrl].aborted = true;
        } else if ((typeof this.state != "string" || !from.includes(this.state))) {
          err = new FSMError(this._state, `${this.name} ${action} to ${to} failed: current state ${this._state} not in from config`);
        }
      } else {
        if (from !== this.state) {
          err = new FSMError(this._state, `${this.name} ${action} to ${to} failed: current state ${this._state} not from ${from}`);
        }
      }
      if (err) {
        if (opt.ignoreError) return err;
        else throw err;
      }

      const old = this.state;
      setState.call(this, new MiddleState(old, to, action));
      const abort = { aborted: false };
      this[abortCtrl] = abort;
      try {
        const result = origin.apply(this, arg);
        if (result instanceof originPromise)
          this[cacheResult] = await result;
        else this[cacheResult] = result;
        if (abort.aborted)
          return this[cacheResult];
        else
          this[abortCtrl] = void 0;
        setState.call(this, to);
        return this[cacheResult];
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setState.call(this, old, msg);
        //err = new FSMError(this._state, `action '${action}' failed :${msg}`, err instanceof Error ? err : new Error(msg));
        if (opt.ignoreError) return err;
        else throw err;
      }
    };
  };
}
export function tryChangeState(from: string | string[], to: string, opt = { ignoreError: true }) {
  ChangeState(from, to, opt);
}
//包含状态，即只在此种状态下方可调用函数
export function Includes(...states: string[]) {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const origin = descriptor.value;
    const action = propertyKey as string;
    descriptor.value = function (this: IAFSM, ...arg: any[]) {
      if (!states.includes(this.state.toString())) throw new FSMError(this.state, `${this.name} ${action} failed: current state ${this.state} not in ${states}`);
      return origin.apply(this, arg);
    };
  };
}
//排除状态，即不在此种状态下方可调用函数
export function Excludes(...states: string[]) {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const origin = descriptor.value;
    const action = propertyKey as string;
    descriptor.value = async function (this: IAFSM, ...arg: any[]) {
      if (states.includes(this.state.toString())) throw new FSMError(this.state, `${this.name} ${action} failed: current state ${this.state} in ${states}`);
      return origin.apply(this, arg);
    };
  };
}

const sendDevTools = (() => {
  //@ts-ignore
  const hasDevTools = typeof window !== 'undefined' && window['__AFSM__'];
  const inWorker = typeof importScripts !== 'undefined';
  return hasDevTools ? (name: string, detail: any) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } : inWorker ? (type: string, payload: any) => {
    postMessage({ type, payload });
  } : () => { };
})();
function setState(this: FSM, value: State, err?: any) {
  const old = this._state;
  this._state = value;
  const state = value.toString();
  if (value) this.emit(state, old);
  this.emit(FSM.STATECHANGED, value, old, err);
  this.updateDevTools({ value, old, err });
}

interface FSMEventTypes {
  stateChanged: [State, State, any];
}

export class FSM<EventTypes extends EventEmitter.ValidEventTypes = string | symbol,
  Context extends any = any> extends EventEmitter<EventTypes | FSMEventTypes, Context> {
  get stateDiagram(): string[] {
    return [];
  }
  static STATECHANGED = 'stateChanged';
  static UPDATEAFSM = 'updateAFSM';
  static INIT = "[*]";//初始状态
  static ON = "on";
  static OFF = "off";
  _state: State = FSM.INIT;
  [cacheResult]: any;
  [abortCtrl]?: { aborted: boolean; };
  constructor(public name?: string, public groupName?: string) {
    super();
    if (!name) name = Date.now().toString(36);
    const prototype = Object.getPrototypeOf(this);
    if (!groupName) this.groupName = this.constructor.name;
    const names = prototype[instance];
    if (!names) prototype[instance] = { name: this.name, count: 0 };
    else this.name = names.name + "-" + names.count++;
    this.updateDevTools({ diagram: this.stateDiagram });
  }
  updateDevTools(payload: any = {}) {
    sendDevTools(FSM.UPDATEAFSM, { name: this.name, group: this.groupName, ...payload });
  }
  get state() {
    return this._state;
  }
}