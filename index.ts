import { EventEmitter } from 'eventemitter3';
export const enum AFSM_ACTION {
  START = 'start',
  START_SUCCESS = 'startSuccess',
  START_FAILED = 'startFailed',
  STOP = 'stop',
  STOP_SUCCESS = 'stopSuccess',
  STOP_FAILED = 'stopFailed',
};
export const enum AFSM_STATE {
  IDLE,
  STARTING,
  RUNNING,
  STOPING,
}
// 四冲程序状态机
const Transitions = [
  {
    [AFSM_ACTION.START]: AFSM_STATE.STARTING,
  },
  {
    [AFSM_ACTION.START_SUCCESS]: AFSM_STATE.RUNNING,
    [AFSM_ACTION.START_FAILED]: AFSM_STATE.IDLE,
    [AFSM_ACTION.STOP]: AFSM_STATE.STOPING,
  },
  {
    [AFSM_ACTION.STOP]: AFSM_STATE.STOPING,
  },
  {
    [AFSM_ACTION.STOP_SUCCESS]: AFSM_STATE.IDLE,
    [AFSM_ACTION.STOP_FAILED]: AFSM_STATE.RUNNING
  }
] as const;
export interface AFSMopt {
  parent?: AFSM;
  name?: string;
  quickStart?: boolean;
  quickStop?: boolean;
  // autoStart?: boolean;
}
export class AFSM extends EventEmitter {
  state: AFSM_STATE = AFSM_STATE.IDLE;
  get running() {
    return this.state == AFSM_STATE.RUNNING;
  }
  // 快速关闭，无需等待
  get quickStop() {
    return !(this.option?.quickStop === false);
  };
  get quickStart() {
    return !(this.option?.quickStart === false);
  };
  name: string;
  constructor(public option?: AFSMopt) {
    super();
    this.name = option?.name || this.constructor.name;
    if (option?.parent) {
      // 级联关闭
      option.parent.on(AFSM_ACTION.STOP, this.stop.bind(this));
    }
  }
  get ready(){
    return new Promise((resolve, reject) => {
      this.once(AFSM_ACTION.START_SUCCESS, resolve);
      this.once(AFSM_ACTION.START_FAILED, reject);
    })
  }
  get closed(){
    return new Promise((resolve, reject) => {
      this.once(AFSM_ACTION.STOP_SUCCESS, resolve);
      this.once(AFSM_ACTION.STOP_FAILED, reject);
    })
  }
  start(...args: any[]) {
    if (this.option?.parent && !this.option.parent.running) {
      return false;
    }
    return this.action(AFSM_ACTION.START, ...args) && (!this.quickStart || this.startSuccess(...args));
  }
  startSuccess(...args: any[]) {
    return this.action(AFSM_ACTION.START_SUCCESS, ...args);
  }
  startFailed(...args: any[]) {
    return this.action(AFSM_ACTION.START_FAILED, ...args);
  }
  stop(...args: any[]) {
    return this.action(AFSM_ACTION.STOP, ...args) && (!this.quickStop || this.stopSuccess());
  }
  stopSuccess(...args: any[]) {
    return this.action(AFSM_ACTION.STOP_SUCCESS, ...args);
  }
  stopFailed(...args: any[]) {
    return this.action(AFSM_ACTION.STOP_FAILED, ...args);
  }
  private action(event: AFSM_ACTION, ...args: any[]) {
    // @ts-ignore
    const to = Transitions[this.state]?.[event];
    if (typeof to == 'number') {
      this.state = to;
      // console.log(this.name, event, from, '->', to, ...args);
      this.emit(event, ...args);
      return true;
    }
    return false;
  }
}