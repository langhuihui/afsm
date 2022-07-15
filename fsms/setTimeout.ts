import { FSM, ChangeState } from '../index';
export class SetTimeout extends FSM {
  id?: number;
  constructor(name?: string) {
    super(name, "setTimeout");
  }
  @ChangeState([FSM.INIT, FSM.OFF], FSM.ON)
  async start(ms: number, ...args: any[]) {
    this.id = setTimeout(() => {
      this.timeout();
    }, ms, ...args);
  }
  @ChangeState(FSM.ON, FSM.OFF)
  async timeout(...args: any[]) {
    this.emit("timeout", ...args);
  }
  @ChangeState([], FSM.INIT)
  async stop() {
    clearTimeout(this.id);
  }
  async reset(ms: number, ...args: any[]) {
    await this.stop();
    return this.start(ms, ...args);
  }
}