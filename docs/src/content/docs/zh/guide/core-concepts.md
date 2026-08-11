---
title: "核心概念"
---


## FSM 类

`FSM` 是所有状态机的基类，继承自 `eventemitter3`。

```ts
import { FSM } from 'afsm'

class MyFSM extends FSM {
  // 你的状态与方法
}

const obj = new MyFSM('my-fsm') // 可选 name
```

### 关键成员

| 成员 | 说明 |
| --- | --- |
| `obj.state` | 当前状态，类型为 `State`（字符串或 `MiddleState`） |
| `obj.stateDiagram` | 自动生成的 mermaid 状态图线条数组 |
| `obj.name` | 状态机实例名（用于 DevTools 显示） |
| `obj.groupName` | 分组名（默认为类名） |
| `obj.on/off/emit` | 继承自 EventEmitter，监听事件 |
| `FSM.STATECHANGED` | 状态变化事件名，常量 `'stateChanged'` |
| `FSM.INIT` | 初始状态，常量 `'[*]'` |
| `FSM.ON` / `FSM.OFF` | 通用状态常量 `'on'` / `'off'` |

## State 类型

```ts
export type State = string | MiddleState
```

状态有两种：

1. **稳定状态**（字符串）— 如 `'idle'`、`'connected'`、`FSM.INIT`
2. **中间状态**（`MiddleState` 实例）— 异步执行期间的过渡态，`toString()` 返回 `${action}ing`

例如调用 `@ChangeState('idle', 'done') async fetch()`：

- 进入中间态 `fetching`（`MiddleState` 实例）
- 成功后变成稳定态 `done`
- 失败后回到 `idle`

## MiddleState 中间态

```ts
export class MiddleState {
  oldState: State
  newState: string
  action: string
  aborted: boolean
  toString() { return `${this.action}ing` }
  abort(fsm: IFSM): void
}
```

中间态描述了「从 `oldState` 经由 `action` 前往 `newState`」的过渡过程。它还可以被 `abort()` 中断（见[中断与 abort](../advanced/abort)）。

## stateDiagram 状态图

`stateDiagram` 是一个 getter，根据装饰器元数据自动生成 mermaid 语法。第一次访问后会缓存到原型上。

```ts
const obj = new MyFSM()
console.log(obj.stateDiagram)
// [
//   "[*] --> gotoState1ing : gotoState1",
//   "gotoState1ing --> state1 : gotoState1 🟢",
//   "gotoState1ing --> [*] : gotoState1 🔴",
//   ...
// ]
```

把这段内容放进 mermaid 的 `stateDiagram-v2` 即可渲染。在 [可视化状态图](./visualization) 一节会详细说明。

## 实例注册表

`FSM` 有两个静态注册表，用于 `context` 组合模式（见[组合式状态机](../advanced/composition)）：

- `FSM.instances: Map<string, IFSM>` — 字符串 key 的注册表
- `FSM.instances2: WeakMap<object, IFSM>` — 对象 key 的注册表
- `FSM.get(context)` — 获取或创建与某个 context 关联的 FSM
- `FSM.getState(context)` — 直接获取某 context 的状态

## IFSM 接口

```ts
export interface IFSM extends FSM {}
```

这是 `FSM` 的自引用接口，主要用于装饰器内部的类型签名。日常使用中你通常直接 `extends FSM` 即可。

## 下一步

- [@ChangeState](./change-state) — 状态迁移装饰器
- [事件系统](./events) — 监听 `stateChanged` 与具体状态事件
