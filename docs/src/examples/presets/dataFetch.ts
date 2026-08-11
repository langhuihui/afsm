import { FSM, ChangeState, ActionState } from 'afsm';
import { registerExample } from '../registry';
import source from './dataFetch.ts?raw';

class DataFetch extends FSM {
  failRate = 0.5;
  maxRetries = 3;
  private timer: any;

  @ChangeState(FSM.INIT, 'idle')
  async reset() {}

  @ChangeState('idle', 'success')
  async fetch() {
    return new Promise<void>((resolve, reject) => {
      this.timer = setTimeout(() => {
        if (Math.random() < this.failRate) reject(new Error('request failed'));
        else resolve();
      }, 800);
    });
  }

  @ActionState('retrying')
  async waitRetry() {
    return new Promise<void>((r) => (this.timer = setTimeout(r, 500)));
  }
}

registerExample({
  key: 'data-fetch',
  source,
  title: { zh: '数据请求', en: 'Data Fetch' },
  description: {
    zh: '模拟带重试的数据请求：idle → fetching → success/failed，使用 @ActionState 体现重试中间态。',
    en: 'Simulates a request with retry: idle -> fetching -> success/failed, using @ActionState for the retry phase.'
  },
  params: [
    {
      key: 'failRate',
      label: { zh: '失败率', en: 'Fail rate' },
      type: 'slider',
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.1
    },
    {
      key: 'maxRetries',
      label: { zh: '最大重试次数', en: 'Max retries' },
      type: 'number',
      default: 3,
      min: 0,
      max: 10,
      step: 1
    }
  ],
  create(params) {
    const f = new DataFetch('fetch');
    f.failRate = params.failRate as number;
    f.maxRetries = params.maxRetries as number;
    return f;
  },
  run(fsm, params, log) {
    const f = fsm as DataFetch;
    f.failRate = params.failRate as number;
    f.maxRetries = params.maxRetries as number;
    let attempt = 0;

    const tryFetch = async () => {
      attempt++;
      log('info', `attempt #${attempt}...`);
      try {
        await f.fetch();
        log('log', `success ✓ after ${attempt} attempt(s)`);
      } catch (e: any) {
        log('warn', `attempt #${attempt} failed: ${e.message}`);
        if (attempt < f.maxRetries) {
          await f.waitRetry();
          return tryFetch();
        } else {
          log('error', `gave up after ${attempt} attempts`);
        }
      }
    };

    f.reset().then(tryFetch);
  },
  cleanup(fsm) {
    const f = fsm as DataFetch;
    if (f.timer) clearTimeout(f.timer);
  }
});

export {};
