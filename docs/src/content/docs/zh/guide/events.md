---
title: "事件系统"
---


AFSM 继承自 `eventemitter3`，状态变更会通过事件分发。

## stateChanged 事件

每次状态变化都会触发 `FSM.STATECHANGED`（即 `'stateChanged'`）：

```ts
obj.on(FSM.STATECHANGED, (newState, oldState, err?) => {
  console.log(`${oldState} → ${newState}`)
})
```

参数：

- `newState: State` — 新状态（字符串或 `MiddleState`）
- `oldState: State` — 旧状态
- `err?: any` — 失败回滚时携带的错误信息

## 具体状态事件

进入某个稳定状态时，会以该状态名作为事件名分发：

```ts
obj.on('connected', (oldState) => {
  console.log(`已连接，旧状态是 ${oldState}`)
})
```

## 中间态事件

进入中间态时，事件名是 `${action}ing`：

```ts
obj.on('connecting', (oldState) => {
  console.log('正在连接...')
})
```

这样你可以分别监听「开始连接」和「连接完成」：

```ts
obj.on('connecting', () => showSpinner())
obj.on('connected', () => hideSpinner())
obj.on('connecting', () => {})  // 失败时不会触发 connected
```

## 一次性监听

`eventemitter3` 提供 `once`：

```ts
obj.once('connected', () => {
  console.log('首次连接成功')
})
```

## 移除监听

```ts
const cb = (newState: State) => console.log(newState)
obj.on(FSM.STATECHANGED, cb)
obj.off(FSM.STATECHANGED, cb)
// 或全部移除
obj.removeAllListeners()
```

## 自定义事件

你的方法可以通过 `emit` 派发任意事件（继承自 EventEmitter）：

```ts
class Timer extends FSM {
  @ChangeState(FSM.ON, FSM.OFF)
  async timeout() {
    this.emit('timeout', Date.now())
  }
}
t.on('timeout' as any, (ts: number) => console.log('fired at', ts))
```

:::tip
`eventemitter3` 默认的 `ValidEventTypes` 是 `string | symbol`，所以 `emit('timeout', ...)` 在类型上需要 `as any` 或者在 `extends FSM<MyEvents>` 时传入泛型声明事件类型。
:::

## 泛型声明事件类型

```ts
interface PlayerEvents {
  play: [url: string]
  stop: []
  stateChanged: [State, State, any]
}

class Player extends FSM<PlayerEvents> {
  @ChangeState('idle', 'playing')
  async play(url: string) {
    this.emit('play', url)  // 类型安全
  }
}
```

## 下一步

- [错误处理](./error-handling) — `FSMError` 详解
- [API: FSM 类](../api/fsm) — 完整 EventEmitter 接口
