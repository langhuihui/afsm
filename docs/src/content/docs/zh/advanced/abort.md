---
title: "中断与 abort"
description: "如何中断进行中的 MiddleState，取消未完成的异步迁移动作。"
---


AFSM 支持中断进行中的中间态（`MiddleState`）。

## abortAction

`@ChangeState` 的 `opt.abortAction` 用于中断指定 action 的中间态：

```ts
class Player extends FSM {
  @ChangeState(FSM.INIT, 'started', { abortAction: undefined })
  async start() {
    await longRunning()   // 期间状态是 'starting' (MiddleState)
  }

  @ChangeState('started', 'stopped', { abortAction: 'start' })
  async stop() {
    // 如果当前正处在 'starting' 中间态，会先调用 middle.abort(fsm)
  }
}
```

调用 `stop()` 时，如果当前正处在 `action='start'` 的 `MiddleState`：

1. `middle.abort(fsm)` 被调用
2. 设置 `middle.aborted = true`
3. `setState(oldState, new Error("action 'start' aborted"))` — 状态回到 `start` 之前的旧状态
4. `stop()` 自身的 `from` 校验会失败（因为状态已回到 `start` 之前，可能不满足 `'started'`）

## from: [] 自动中断

`from: []`（任意状态）会自动中断进行中的中间态：

```ts
@ChangeState([], 'reset')
async reset() {}
```

无论当前处于什么中间态，都会先被中断（`middle.abort(fsm)`），然后强制迁移到 `reset`。

## MiddleState.abort

```ts
class MiddleState {
  aborted: boolean = false
  abort(fsm: IFSM): void
}
```

`abort(fsm)`：

1. `this.aborted = true`
2. `setState.call(fsm, this.oldState, new Error("action '{action}' aborted"))`
3. 状态回到 `oldState`，发出 `stateChanged` 事件（带错误）

中断后，原方法若仍在执行，其 `success` 回调会检查 `middle.aborted`：

```ts
const success = (result: any) => {
  fsm[cacheResult] = result
  if (!middle.aborted) {        // 若已中断，不切到 to
    setState.call(fsm, to)
    opt.success?.call(this, fsm[cacheResult])
  }
  return result
}
```

注意：`abort()` **不会**取消原方法的执行（它无法取消 Promise）。它只是阻止状态切到 `to`，并回滚到 `oldState`。原方法若持有资源，需要自行清理。

## 监听中断

中断会触发 `stateChanged` 事件，`err` 参数携带 `Error("action '...' aborted")`：

```ts
obj.on(FSM.STATECHANGED, (newState, oldState, err) => {
  if (err && err.message.includes('aborted')) {
    console.log('被中断:', err.message)
  }
})
```

## 示例场景

- 用户点击「停止」时中断进行中的「开始」操作
- 网络断开时强制重置（`from: []`）
- 切换页面时取消未完成的请求

## 下一步

- [同步模式](./sync-mode)
- [API: MiddleState.abort](../api/middle-state#abort)
