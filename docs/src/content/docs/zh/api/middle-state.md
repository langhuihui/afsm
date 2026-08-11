---
title: "MiddleState"
---


中间过渡状态。表示「正在从 `oldState` 经由 `action` 前往 `newState`」的过程。

## 定义

```ts
export class MiddleState {
  oldState: State
  newState: string
  action: string
  aborted: boolean = false

  constructor(oldState: State, newState: string, action: string)
  abort(fsm: IFSM): void
  toString(): string   // 返回 `${action}ing`
}
```

## 字段

| 字段 | 说明 |
| --- | --- |
| `oldState` | 起始状态 |
| `newState` | 目标状态（成功后的稳定状态） |
| `action` | 动作名（默认是被装饰的方法名，可由 `opt.action` 覆盖） |
| `aborted` | 是否已被中断 |

## toString

```ts
const m = new MiddleState('idle', 'done', 'fetch')
m.toString()   // 'fetching'
```

`state` 属性在中间态期间返回这个 `MiddleState` 实例，但 `state.toString()` 总是返回字符串形式。

## abort

```ts
abort(fsm: IFSM): void
```

中断该中间态：

1. 设置 `aborted = true`
2. 调用 `setState.call(fsm, oldState, new Error("action '{action}' aborted"))`
3. 状态回到 `oldState`，发出 `stateChanged` 事件（带错误）

中断后，原方法若仍在执行，其 `success` 回调会检查 `middle.aborted`，若已中断则不会 `setState(to)`。

## 何时出现

调用 `@ChangeState` 装饰的方法时自动创建：

```ts
@ChangeState('idle', 'done')
async fetch() {
  // 此时 this.state 是 MiddleState('idle', 'done', 'fetch')
  // this.state.toString() === 'fetching'
}
```

## 监听中间态

中间态会以 `${action}ing` 作为事件名发出：

```ts
obj.on('fetching', (oldState) => {
  console.log('开始 fetch，旧状态', oldState)
})
```

也会作为 `stateChanged` 事件的 `newState` 参数（类型为 `MiddleState`）。

## 参见

- [中断与 abort](../advanced/abort)
- [@ChangeState](./change-state)
- [State 类型](./types)
