---
title: "FSM 类"
description: "FSM 基类 API：当前状态、事件、stateDiagram、以及继承自 EventEmitter 的能力。"
---


`FSM` 是所有状态机的基类，继承自 `eventemitter3` 的 `EventEmitter`。

## 泛型

```ts
class FSM<
  EventTypes extends EventEmitter.ValidEventTypes = string | symbol,
  Context extends any = any
> extends EventEmitter<EventTypes | FSMEventTypes, Context>
```

- `EventTypes` — 自定义事件类型声明（用于类型安全的 `emit`/`on`）
- `Context` — EventEmitter 上下文

```ts
interface MyEvents {
  play: [url: string]
  stateChanged: [State, State, any]
}
class Player extends FSM<MyEvents> { ... }
```

## 实例属性

### `state: State`

当前状态（getter）。`State = string | MiddleState`。

```ts
const obj = new MyFSM()
console.log(obj.state)   // '[*]'
```

设置器也会触发 `setState` 流程（发出事件），但通常应该通过 `@ChangeState` 改变状态。

### `_state: State`

内部状态字段（`state` 的底层存储）。直接修改不会触发事件，慎用。

### `stateDiagram: string[]`

只读 getter。根据装饰器元数据自动生成 mermaid `stateDiagram-v2` 行。第一次访问后会被缓存到原型上。

### `name?: string`

实例名，用于 DevTools 显示。构造时自动生成（基于时间戳或父类同名 + 计数）。

### `groupName?: string`

分组名，默认为 `constructor.name`。用于在 DevTools 树里归类。

## 实例方法

继承自 `eventemitter3`：

- `on(event, cb)` — 监听
- `once(event, cb)` — 一次性监听
- `off(event, cb)` — 移除
- `emit(event, ...args)` — 派发
- `removeAllListeners(event?)` — 移除全部或指定事件监听

### `updateDevTools(payload?)`

向 DevTools 扩展发送更新。通常不需要手动调用——`setState` 会自动调用。库会为每个实例保留最近一次快照，并在扩展派发 `__AFSM_DUMP__` 时重放。

## 构造函数

```ts
constructor(name?: string, groupName?: string, prototype?: any)
```

- `name` — 可选实例名
- `groupName` — 可选分组名
- `prototype` — 内部使用（用于 `FSM.get` 创建代理实例）

```ts
class Player extends FSM {
  constructor() {
    super('player', 'media')   // name='player', groupName='media'
  }
}
```

## 静态常量

| 常量 | 值 |
| --- | --- |
| `FSM.STATECHANGED` | `'stateChanged'` |
| `FSM.UPDATEAFSM` | `'updateAFSM'` |
| `FSM.INIT` | `'[*]'` |
| `FSM.ON` | `'on'` |
| `FSM.OFF` | `'off'` |

## 静态注册表

### `FSM.instances: Map<string, IFSM>`

字符串 key 的实例注册表，用于 `context` 组合模式。

### `FSM.instances2: WeakMap<object, IFSM>`

对象 key 的实例注册表。

### `FSM.get(context: string | object): IFSM`

获取或创建与某个 context 关联的 FSM。如果不存在，会用 `Object.create(FSM.prototype)` 创建一个最小代理实例。

```ts
const fsm = FSM.get('shared-timer')
const same = FSM.get('shared-timer')
console.log(fsm === same)  // true
```

### `FSM.getState(context: string | object): State`

直接获取某 context 的状态（不存在时返回 `undefined`）。

## 内部 symbols

以下 symbol 用于内部状态，普通使用不应直接访问：

- `[cacheResult]` — 缓存上次成功结果
- `[abortCtrl]` — 中断控制（保留字段）

## 下一步

- [@ChangeState](./change-state) — 状态迁移装饰器
- [组合式状态机](../advanced/composition) — `FSM.get` 与 `context` 的实战
