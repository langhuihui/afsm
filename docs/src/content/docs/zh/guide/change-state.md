---
title: "@ChangeState 状态变更"
description: "@ChangeState 把异步方法包装成状态迁移动作，自动处理中间态、成功目标态与失败回滚。"
---


`@ChangeState` 是 AFSM 最核心的装饰器，把一个异步方法包装成「状态迁移动作」。

## 签名

```ts
function ChangeState(
  from: string | string[],
  to: string,
  opt?: ChangeOption
): MethodDecorator
```

- `from` — 允许的起始状态；传数组表示多个状态均可；传空数组 `[]` 表示任意状态
- `to` — 目标状态
- `opt` — 可选配置，见下文

## 基本用法

```ts
class Conn extends FSM {
  @ChangeState(FSM.INIT, 'connected')
  async connect() {
    await doConnect()       // 成功后状态自动变 connected
  }                         // 失败后状态自动回到 [*]
}
```

调用 `connect()` 时发生：

1. 校验当前状态 ∈ `from`，否则抛出 `FSMError`
2. 进入中间态 `connecting`（`MiddleState` 实例，`toString()` 返回 `'connecting'`）
3. 执行原方法
4. **成功** → 状态变为 `to`（`'connected'`）
5. **失败** → 状态回到 `from`（`FSM.INIT`），并 reject 原错误

## from 的几种写法

```ts
// 单一起始状态
@ChangeState('idle', 'done')
async fetch() {}

// 多个起始状态
@ChangeState([FSM.INIT, 'disconnected'], 'connected')
async connect() {}

// 空数组：任意状态都可以，且会中断进行中的 MiddleState
@ChangeState([], 'disconnected')
async disconnect() {}
```

:::tip
`from: []` 在实现「强制重置 / 紧急断开」类操作时非常有用——无论当前处于什么状态（包括中间态），都可以强制迁移。
:::

## ChangeOption 配置

```ts
interface ChangeOption {
  ignoreError?: boolean       // 失败时不抛错，而是返回错误对象
  action?: string             // 自定义动作名（默认用方法名）
  success?: (result) => any   // 成功回调
  fail?: (err: FSMError) => any // 失败回调
  context?: string | object | ((this, ...args) => string | object) // 组合多状态机
  abortAction?: string        // 中断指定 action 的中间态
  sync?: boolean              // 同步模式，见同步模式章节
}
```

### ignoreError

```ts
@ChangeState('idle', 'done', { ignoreError: true })
async fetch() {
  await mayFail()
}
const r = await obj.fetch()
// 失败时 r 是 FSMError，而不是 reject
```

### action 自定义动作名

默认情况下，中间态名 = 方法名 + `ing`。可以用 `action` 自定义：

```ts
@ChangeState('idle', 'done', { action: 'load' })
async fetch() {}
// 中间态是 'loading' 而不是 'fetching'
```

### success / fail 回调

```ts
@ChangeState('idle', 'done', {
  success: (result) => saveCache(result),
  fail: (err) => reportError(err)
})
async fetch() {}
```

回调内的 `this` 指向被装饰方法所属的实例。

### context — 组合多状态机

当一个类内部需要多个独立的状态机时，用 `context` 隔离：

```ts
class App extends FSM {
  @ChangeState(FSM.INIT, 'started', { context: 'timer' })
  async startTimer() {}

  @ChangeState('started', FSM.INIT, { context: 'timer', abortAction: 'startTimer' })
  async stopTimer() {}
}
```

详见[组合式状态机](../advanced/composition)。

### abortAction — 中断中间态

如果当前正处在某个中间态，且该中间态的 `action` 等于 `abortAction`，调用此方法会中断它：

```ts
@ChangeState('started', 'stopped', { abortAction: 'start' })
async stop() {}
```

详见[中断与 abort](../advanced/abort)。

## 同步方法

`@ChangeState` 也兼容同步函数：方法返回普通值时，会立即完成状态迁移：

```ts
@ChangeState('idle', 'ready')
init() {        // 同步方法
  return 42
}
```

不过默认仍然返回 `Promise`。要拿到同步返回值，需开启 `sync: true`（见[同步模式](../advanced/sync-mode)）。

## 重复调用与缓存

如果当前状态已经是 `to`，调用方法会直接返回（不重新执行）：

```ts
await obj.connect()   // 状态变 connected
await obj.connect()   // 直接 resolve，不执行 doConnect
```

成功的结果会被缓存（`[cacheResult]` symbol），重复调用返回缓存值。

## 下一步

- [其他装饰器](./decorators) — `@Includes` / `@Excludes` / `@ActionState`
- [错误处理](./error-handling) — `FSMError`、`ignoreError`、`fail` 回调
