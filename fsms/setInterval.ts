import { FSM, ChangeState } from '../index';
export class SetInterval extends FSM {
  id?: number;
  constructor(name?: string) {
    super(name, "setInterval");
  }
  @ChangeState([FSM.INIT, FSM.OFF], FSM.ON)
  async start(ms: number, ...args: any[]) {
    this.id = setInterval(() => {
      this.emit("interval", ...args);
    }, ms, ...args);
  }
  @ChangeState([], FSM.OFF)
  async stop() {
    clearInterval(this.id);
  }
  async reset(ms: number, ...args: any[]) {
    await this.stop();
    return this.start(ms, ...args);
  }
}