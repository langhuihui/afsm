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
      if (target?.[fromsKey]?.[propertyKey] && (!target[fromsKey][propertyKey].includes(this.state))) {
        throw new Error(`${propertyKey as string} can not be called in ${this.state}`);
      }
      this.state = `${this.state}(${propertyKey as string})${state}`;
      try {
        const result = await origin.apply(this, arg);
        this.state = state;
        return result;
      } catch (err) {
        throw err;
      }
    };
  };
}
export class FSM extends EventEmitter {
  _state: string = "";
  static STATECHANGED = 'stateChanged';
  get state() {
    return this._state;
  }
  set state(value: string) {
    const old = this._state;
    // console.log(`${this.options.name || this.constructor.name} state change from ${this._state} to ${value}`);
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
}