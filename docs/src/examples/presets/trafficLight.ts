import { FSM, ChangeState } from 'afsm';
import { registerExample } from '../registry';
import source from './trafficLight.ts?raw';

/**
 * Traffic Light — a cyclic state machine.
 * States: red -> green -> yellow -> red ...
 */
class TrafficLight extends FSM {
  greenMs = 3000;
  yellowMs = 1000;
  redMs = 3000;
  private timer: any;

  @ChangeState(FSM.INIT, 'red')
  async init() {}

  @ChangeState('red', 'green')
  async go() {
    this.timer = setTimeout(() => this.warn(), this.greenMs);
  }

  @ChangeState('green', 'yellow')
  async warn() {
    this.timer = setTimeout(() => this.stop(), this.yellowMs);
  }

  @ChangeState('yellow', 'red')
  async stop() {
    this.timer = setTimeout(() => this.go(), this.redMs);
  }
}

registerExample({
  key: 'traffic-light',
  source,
  title: { zh: '红绿灯', en: 'Traffic Light' },
  description: {
    zh: '一个循环状态机：红 → 绿 → 黄 → 红。适合首页自动演示。',
    en: 'A cyclic state machine: red -> green -> yellow -> red. Good for auto-demo on the home page.'
  },
  params: [
    {
      key: 'greenMs',
      label: { zh: '绿灯时长(ms)', en: 'Green duration (ms)' },
      type: 'slider',
      default: 3000,
      min: 500,
      max: 8000,
      step: 500
    },
    {
      key: 'yellowMs',
      label: { zh: '黄灯时长(ms)', en: 'Yellow duration (ms)' },
      type: 'slider',
      default: 1000,
      min: 300,
      max: 4000,
      step: 100
    },
    {
      key: 'redMs',
      label: { zh: '红灯时长(ms)', en: 'Red duration (ms)' },
      type: 'slider',
      default: 3000,
      min: 500,
      max: 8000,
      step: 500
    }
  ],
  create(params) {
    const t = new TrafficLight('traffic-light');
    t.greenMs = params.greenMs as number;
    t.yellowMs = params.yellowMs as number;
    t.redMs = params.redMs as number;
    return t;
  },
  run(fsm, params, log) {
    const t = fsm as TrafficLight;
    t.greenMs = params.greenMs as number;
    t.yellowMs = params.yellowMs as number;
    t.redMs = params.redMs as number;
    log('info', 'starting traffic light');
    t.init().then(() => t.go());
  },
  cleanup(fsm) {
    const t = fsm as TrafficLight;
    if (t.timer) clearTimeout(t.timer);
  }
});

export {};
