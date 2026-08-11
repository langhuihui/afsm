import { FSM, ChangeState } from 'afsm';
import { registerExample } from '../registry';
import source from './setInterval.ts?raw';

class SetIntervalFSM extends FSM {
  id?: any;

  @ChangeState([FSM.INIT, FSM.OFF], FSM.ON)
  async start(ms: number) {
    this.id = setInterval(() => this.emit('interval'), ms);
  }

  @ChangeState([], FSM.OFF)
  async stop() {
    if (this.id) clearInterval(this.id);
  }
}

registerExample({
  key: 'setinterval',
  source,
  title: { zh: '定时器 setInterval', en: 'setInterval Timer' },
  description: {
    zh: '把 setInterval 包装成状态机：ON 期间持续触发 interval 事件。',
    en: 'Wraps setInterval as a state machine: stays ON while emitting interval events.'
  },
  params: [
    {
      key: 'ms',
      label: { zh: '间隔(ms)', en: 'Interval (ms)' },
      type: 'slider',
      default: 1500,
      min: 300,
      max: 5000,
      step: 100
    }
  ],
  create(params) {
    return new SetIntervalFSM('interval');
  },
  run(fsm, params, log) {
    const t = fsm as SetIntervalFSM;
    let count = 0;
    t.on('interval' as any, () => log('log', `tick #${++count} ⏱`));
    log('info', `starting ${params.ms}ms interval`);
    t.start(params.ms as number);
  },
  cleanup(fsm) {
    const t = fsm as SetIntervalFSM;
    if (t.id) clearInterval(t.id);
  }
});

export {};
