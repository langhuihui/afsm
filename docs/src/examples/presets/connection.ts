import { FSM, ChangeState } from 'afsm';
import { registerExample } from '../registry';
import source from './connection.ts?raw';

class Connection extends FSM {
  successRate = 0.8;
  delay = 1000;
  reconnectDelay = 1000;
  private timer: any;

  @ChangeState(FSM.INIT, 'connected')
  async connect() {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < this.successRate) resolve();
        else reject(new Error('connect failed'));
      }, this.delay);
    });
  }

  @ChangeState('disconnected', 'reconnected')
  async reconnect() {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < this.successRate) resolve();
        else reject(new Error('reconnect failed'));
      }, this.delay);
    });
  }

  @ChangeState([], 'disconnected')
  async disconnect() {
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    this.timer = setTimeout(() => {
      this.reconnect()
        .then(() => console.log('reconnected'))
        .catch(() => this.scheduleReconnect());
    }, this.reconnectDelay);
  }
}

registerExample({
  key: 'connection',
  source,
  title: { zh: '连接管理', en: 'Connection' },
  description: {
    zh: '模拟网络连接：connect / disconnect / reconnect，带成功率与重试。',
    en: 'Simulates a network connection with connect / disconnect / reconnect, success rate and retry.'
  },
  params: [
    {
      key: 'successRate',
      label: { zh: '成功率', en: 'Success rate' },
      type: 'slider',
      default: 0.8,
      min: 0,
      max: 1,
      step: 0.05
    },
    {
      key: 'delay',
      label: { zh: '连接延迟(ms)', en: 'Connect delay (ms)' },
      type: 'slider',
      default: 1000,
      min: 200,
      max: 5000,
      step: 200
    },
    {
      key: 'reconnectDelay',
      label: { zh: '重连延迟(ms)', en: 'Reconnect delay (ms)' },
      type: 'slider',
      default: 1000,
      min: 200,
      max: 5000,
      step: 200
    }
  ],
  create(params) {
    const c = new Connection('conn');
    c.successRate = params.successRate as number;
    c.delay = params.delay as number;
    c.reconnectDelay = params.reconnectDelay as number;
    return c;
  },
  run(fsm, params, log) {
    const c = fsm as Connection;
    c.successRate = params.successRate as number;
    c.delay = params.delay as number;
    c.reconnectDelay = params.reconnectDelay as number;
    log('info', 'connecting...');
    c.connect()
      .then(() => log('log', 'connected ✓'))
      .catch((e: Error) => log('error', e.message));
  },
  cleanup(fsm) {
    const c = fsm as Connection;
    if (c.timer) clearTimeout(c.timer);
  }
});

export {};
