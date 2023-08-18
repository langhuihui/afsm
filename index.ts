import EventEmitter from 'eventemitter3';
export interface IFSM extends FSM {

}
const instance = Symbol('instance');
const abortCtrl = Symbol('abortCtrl');
const cacheResult = Symbol('cacheResult');
export type State = string | MiddleState;
type contextType = string | object;
export interface ChangeOption {
  ignoreError?: boolean;
  action?: string;
  success?: (result: any) => any;
  fail?: (err: FSMError) => any;
  /**
   * 用于组合一组状态，当一个类里面有多个状态机时，可以用此属性来区分
   */
  context?: ((this: IFSM, ...args: any[]) => contextType) | contextType;
  /**
   * 用于中断状态机，当状态机处于中间状态时，调用此函数，会中断状态机。
   */
  abortAction?: string;
}

// 中间过渡状态
export class MiddleState {
  aborted = false;
  constructor(public oldState: State, public newState: string, public action: string) {
  }
  abort(fsm: IFSM) {
    this.aborted = true;
    setState.call(fsm, this.oldState, new Error(`action '${this.action}' aborted`));
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
function thenAble<T>(val: T | Promise<T>): val is Promise<T> {
  return typeof val === 'object' && val && 'then' in val;
}
const stateDiagram = new Map<Object, { from: string | string[], to: string, action: string; }[]>();
// const originPromise = Object.getPrototypeOf((async () => { })()).constructor;
export function ChangeState(from: string | string[], to: string, opt: ChangeOption = {}) {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const action = opt.action || propertyKey as string;
    if (!opt.context) {
      const stateConfig = stateDiagram.get(target) || [];
      if (!stateDiagram.has(target)) stateDiagram.set(target, stateConfig);
      stateConfig.push({ from, to, action });
    }
    const origin = descriptor.value;
    descriptor.value = function (this: IFSM, ...arg: any[]) {
      let fsm = this;
      if (opt.context) {
        // @ts-ignore
        fsm = FSM.get(typeof opt.context === 'function' ? opt.context.call(this, ...arg) : opt.context);
      }
      if (fsm.state === to) return fsm[cacheResult];
      else if (fsm.state instanceof MiddleState) {
        if (fsm.state.action == opt.abortAction) {
          fsm.state.abort(fsm);
        }
      }
      let err: FSMError | null = null;
      if (Array.isArray(from)) {
        if (from.length == 0) {
          if (fsm.state instanceof MiddleState) fsm.state.abort(fsm);
        } else if ((typeof fsm.state != "string" || !from.includes(fsm.state))) {
          err = new FSMError(fsm._state, `${fsm.name} ${action} to ${to} failed: current state ${fsm._state} not in from config`);
        }
      } else {
        if (from !== fsm.state) {
          err = new FSMError(fsm._state, `${fsm.name} ${action} to ${to} failed: current state ${fsm._state} not from ${from}`);
        }
      }
      if (err) {
        if (opt.fail) opt.fail.call(this, err);
        else if (opt.ignoreError) return err;
        else throw err;
      }

      const old = fsm.state;
      const middle = new MiddleState(old, to, action);
      setState.call(fsm, middle);
      const success = (result: any) => {
        fsm[cacheResult] = result;
        if (!middle.aborted) {
          setState.call(fsm, to);
          opt.success?.call(this, fsm[cacheResult]);
        }
        return result;
      };
      const failed = (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setState.call(fsm, old, err);
        if (opt.fail) opt.fail.call(this, new FSMError(fsm._state, `action '${action}' failed :${msg}`, err instanceof Error ? err : new Error(msg)));
        else if (opt.ignoreError) return err;
        else throw err;
      };
      try {
        const result = origin.apply(this, arg);
        if (thenAble(result)) return result.then(success).catch(failed);
        else return success(result);
      } catch (err) {
        failed(err);
      }
    };
  };
}
export function tryChangeState(from: string | string[], to: string, opt: ChangeOption = { ignoreError: true }) {
  ChangeState(from, to, opt);
}
//包含状态，即只在此种状态下方可调用函数
export function Includes(...states: string[]) {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const origin = descriptor.value;
    const action = propertyKey as string;
    descriptor.value = function (this: IFSM, ...arg: any[]) {
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
    descriptor.value = async function (this: IFSM, ...arg: any[]) {
      if (states.includes(this.state.toString())) throw new FSMError(this.state, `${this.name} ${action} failed: current state ${this.state} in ${states}`);
      return origin.apply(this, arg);
    };
  };
}
//动作状态，即异步函数执行期间，状态为actioning,或者自定义名称，结束后回到原状态
export function ActionState(name?: string) {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const origin = descriptor.value;
    const action = name || propertyKey as string;
    descriptor.value = function (this: IFSM, ...arg: any[]) {
      const old = this.state;
      setState.call(this, action);
      try {
        let result = origin.apply(this, arg);
        const success = (result: any) => {
          setState.call(this, old);
          return result;
        };
        if (thenAble(result)) return result.then(success);
        return success(result);
      } catch (err) {
        setState.call(this, old, err);
        throw err;
      }
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
  this.updateDevTools({ value, old, err: err instanceof Error ? err.message : String(err) });
}

interface FSMEventTypes {
  stateChanged: [State, State, any];
}

export class FSM<EventTypes extends EventEmitter.ValidEventTypes = string | symbol,
  Context extends any = any> extends EventEmitter<EventTypes | FSMEventTypes, Context> {
  get stateDiagram(): string[] {
    const protoType = Object.getPrototypeOf(this);
    const stateConfig = stateDiagram.get(protoType) || [];
    let result = new Set<string>();
    let plain: { from: string; to: string; action: string; }[] = [];
    let forceTo: { to: string; action: string; }[] = [];

    const allState = new Set();
    const parent = Object.getPrototypeOf(protoType);
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
    Object.defineProperties(protoType, {
      stateDiagram: { value },
      allStates: { value: allState }
    });
    return value;
  }
  static readonly STATECHANGED = 'stateChanged';
  static readonly UPDATEAFSM = 'updateAFSM';
  static readonly INIT = "[*]";//初始状态
  static readonly ON = "on";
  static readonly OFF = "off";
  static instances = new Map<string, IFSM>();
  static instances2 = new WeakMap<object, IFSM>();
  static get(context: string | object) {
    let fsm: IFSM | undefined;
    if (typeof context === 'string') {
      fsm = FSM.instances.get(context);
      if (!fsm) {
        FSM.instances.set(context, fsm = new FSM(context, undefined, Object.create(FSM.prototype)));
      }
    } else {
      fsm = FSM.instances2.get(context);
      if (!fsm) {
        FSM.instances2.set(context, fsm = new FSM(context.constructor.name, undefined, Object.create(FSM.prototype)));
      }
    }
    return fsm;
  }
  static getState(context: string | object) {
    return FSM.get(context)?.state;
  }
  _state: State = FSM.INIT;
  [cacheResult]: any;
  [abortCtrl]?: { aborted: boolean; };
  constructor(public name?: string, public groupName?: string, prototype?: any) {
    super();
    if (!name) name = Date.now().toString(36);
    if (!prototype) prototype = Object.getPrototypeOf(this);
    else Object.setPrototypeOf(this, prototype);
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
  set state(value: State) {
    setState.call(this, value);
  }
}