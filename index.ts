import EventEmitter from 'eventemitter3';
export interface IAFSM extends AFSM {

}
const fromsKey = Symbol('froms');
export function From(...from: string[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    target[fromsKey] = target[fromsKey] || {};
    target[fromsKey][propertyKey] = target[fromsKey][propertyKey] || [];
    target[fromsKey][propertyKey].push(...from);
  };
}
export function To(state: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const origin = descriptor.value;
    descriptor.value = async function (this: IAFSM, ...arg: any[]) {
      const froms = target?.[fromsKey]?.[propertyKey];
      if (froms) {
        if ((!froms.includes(this.state)))
          throw FSM.ESTATE;
      } else if (this.abortCtrl) {
        this.abortCtrl.aborted = true;
      }
      this.state = `${this.state}(${propertyKey as string})${state}`;
      const abort = { aborted: false };
      this.abortCtrl = abort;
      const result = await origin.apply(this, arg);
      if (abort.aborted) {
        throw FSM.EABORT;
      } else {
        this.abortCtrl = void 0;
      }
      this.state = state;
      return result;
    };
  };
}
export class FSM extends EventEmitter {
  _state: string = "";
  abortCtrl?: { aborted: boolean; };
  static STATECHANGED = 'stateChanged';
  static EABORT = new Error('abort');
  static ESTATE = new Error('wrong state');
  get state() {
    return this._state;
  }
  set state(value: string) {
    const old = this._state;
    console.log(`${this.constructor.name} state change from ${this._state} to ${value}`);
    this._state = value;
    this.emit(value, old);
    this.emit(FSM.STATECHANGED, old, value);
  }
}
export class AFSM extends FSM {
  static OFF = 'off';
  static ON = 'on';
  static INIT = '';
  @From(AFSM.OFF, AFSM.INIT)
  @To(AFSM.ON)
  async start() {

  }
  @From(AFSM.ON)
  @To(AFSM.OFF)
  async stop() {

  }
  @To(AFSM.OFF)
  async forceStop() {

  }
}