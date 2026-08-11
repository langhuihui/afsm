import { FSM, ChangeState } from 'afsm';
import { registerExample } from '../registry';
import source from './setTimeout.ts?raw';

class SetTimeoutFSM extends FSM {
  id?: any;

  @ChangeState([FSM.INIT, FSM.OFF], FSM.ON)
  async start(ms: number) {
    this.id = setTimeout(() => this.timeout(), ms);
  }

  @ChangeState(FSM.ON, FSM.OFF)
  async timeout() {
    this.emit('timeout');
  }

  @ChangeState([], FSM.INIT)
  async stop() {
    if (this.id) clearTimeout(this.id);
  }
}

registerExample({
  key: 'settimeout',
  source,
  title: { zh: '定时器 setTimeout', en: 'setTimeout Timer' },
  description: {
    zh: '把 setTimeout 包装成状态机：ON 期间等待，触发后回到 OFF。',
    en: 'Wraps setTimeout as a state machine: ON while waiting, returns to OFF after firing.'
  },
  params: [
    {
      key: 'ms',
      label: { zh: '延时(ms)', en: 'Delay (ms)' },
      type: 'slider',
      default: 2000,
      min: 500,
      max: 10000,
      step: 500
    }
  ],
  create(params) {
    return new SetTimeoutFSM('timer');
  },
  run(fsm, params, log) {
    const t = fsm as SetTimeoutFSM;
    t.on('timeout' as any, () => log('log', 'timeout fired ⏰'));
    log('info', `starting ${params.ms}ms timer`);
    t.start(params.ms as number);
  },
  cleanup(fsm) {
    const t = fsm as SetTimeoutFSM;
    if (t.id) clearTimeout(t.id);
  }
});

export {};
