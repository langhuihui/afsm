---
title: "组合式状态机"
description: "在同一类中通过 opt.context 组合多个独立状态机，隔离命名空间与迁移。"
---


一个类内部可以包含多个独立的状态机，通过 `opt.context` 隔离。

## 场景

例如一个 `App` 类既管理「定时器」状态机，又管理「连接」状态机。它们状态独立，互不干扰。

## 用法

```ts
class App extends FSM {
  // 定时器状态机（context='timer'）
  @ChangeState([FSM.INIT, FSM.OFF], FSM.ON, { context: 'timer' })
  async startTimer() {}

  @ChangeState(FSM.ON, FSM.OFF, { context: 'timer' })
  async stopTimer() {}

  // 连接状态机（context='conn'）
  @ChangeState(FSM.INIT, 'connected', { context: 'conn' })
  async connect() {}
}
```

调用 `app.startTimer()` 时：

1. `fsm = FSM.get('timer')`（从 `FSM.instances` Map 获取或创建）
2. 状态变更在 `fsm` 上发生，而不是 `app` 自身

`app.state` 仍然是 `app` 自身的状态（可能是 `FSM.INIT`，因为没有 `@ChangeState` 不带 context 的方法作用于 `app`）。

## FSM.get(context)

```ts
static get(context: string | object): IFSM
```

- 字符串：从 `FSM.instances` Map 获取
- 对象：从 `FSM.instances2` WeakMap 获取

不存在时自动创建一个最小代理实例（`Object.create(FSM.prototype)`），并注册。

```ts
const fsm1 = FSM.get('timer')
const fsm2 = FSM.get('timer')
console.log(fsm1 === fsm2)  // true
```

## 监听组合状态机

监听 context 关联的 FSM 而非 `app`：

```ts
const timerFsm = FSM.get('timer')
timerFsm.on(FSM.STATECHANGED, (newState) => {
  console.log('timer:', newState)
})
```

## context 为函数

`context` 也可以是函数，运行时根据参数动态决定：

```ts
@ChangeState(FSM.INIT, 'connected', {
  context: (this, url) => `conn:${url}`
})
async connect(url: string) {}
```

每次 `connect(url)` 会获取与 `url` 关联的 FSM。

## stateDiagram 与 context

设置 `opt.context` 的 `@ChangeState` **不会**注册到模块级 `stateDiagram` Map（避免把多个状态机的边混在一起）。因此组合状态机的每个子状态机图需要单独获取：

```ts
const timerFsm = FSM.get('timer')
console.log(timerFsm.stateDiagram)  // 注意：代理实例无装饰器元数据
```

:::tip
组合模式的子状态机是 `FSM.get` 创建的代理实例（`Object.create(FSM.prototype)`），它没有装饰器元数据，因此 `stateDiagram` 为空。要获得完整状态图，建议为每个子状态机定义独立的 `extends FSM` 类。
:::

## 下一步

- [中断与 abort](./abort) — `abortAction` 配合 context 使用
- [API: ChangeOption.context](../api/types#changeoption)
