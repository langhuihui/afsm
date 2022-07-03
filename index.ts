import EventEmitter from 'eventemitter3';
export interface IAFSM extends FSM {

}
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
          let result: string[] = [];
          let plain: { from: string; to: string; action: string; }[] = [];
          let forceTo: { to: string; action: string; }[] = [];
          const stateConfig = stateDiagram.get(target)!;
          const allState = new Set();
          stateConfig.forEach(({ from, to, action }) => {
            allState.add(to);
            if (typeof from === 'string') {
              allState.add(from);
              plain.push({ from, to, action });
              allState.add(action + "ing");
            } else {
              if (from.length) {
                from.forEach(f => {
                  allState.add(f);
                  plain.push({ from: f, to, action });
                });
                allState.add(action + "ing");
              }
              else forceTo.push({ to, action });
            }
          });
          plain.forEach(({ from, to, action }) => {
            result.push(`${from} --> ${action}ing : ${action}`, `${action}ing --> ${to} : ${action} 🟢`, `${action}ing --> ${from} : ${action} 🔴`);
          });
          forceTo.forEach(({ to, action }) => {
            result.push(`${action}ing --> ${to} : ${action} 🟢`);
            allState.forEach(f => {
              if (f !== to)
                result.push(`${f} --> ${action}ing : ${action}`);
            });
          });
          return result;
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
export class FSM extends EventEmitter {
  static STATECHANGED = 'stateChanged';
  static EABORT = new Error('abort');
  static ESTATE = new Error('wrong state');
  static INIT = "[*]";
  get stateDiagram() {
    return [];
  }
  _state: State = FSM.INIT;
  abortCtrl?: { aborted: boolean; };
  constructor(public name?: string) {
    super();
    this.name = this.name || this.constructor.name;
    if (hasDevTools) window.dispatchEvent(new CustomEvent("createAFSM", { detail: { name: this.name, diagram: this.stateDiagram } }));
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
    if (hasDevTools) {
      window.dispatchEvent(new CustomEvent("changeAFSM", { detail: { name: this.name, value, old } }));
    }
  }
}