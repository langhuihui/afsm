---
title: "继承"
description: "AFSM 支持继承：子类自动合并父类状态图与装饰器元数据。"
---


AFSM 支持继承。子类会自动合并父类的状态图。

## 基本继承

```ts
class Base extends FSM {
  @ChangeState(FSM.INIT, 'connected')
  async connect() {}

  @ChangeState([], 'disconnected')
  async disconnect() {}
}

class Advanced extends Base {
  @ChangeState('connected', 'authenticated')
  async authenticate() {}
}
```

`Advanced` 的 `stateDiagram` 会包含 `Base` 的所有边加上自己的 `authenticate` 边。

## stateDiagram 合并逻辑

`stateDiagram` getter 在首次访问时：

1. 读取当前 prototype 对应的装饰器元数据（`stateDiagram` Map）
2. 递归读取父类 prototype 的 `stateDiagram`（通过 `parent.stateDiagram`）
3. 合并所有边与状态
4. 用 `Object.defineProperties` 缓存到当前 prototype

```ts
// 简化版伪代码
const proto = Object.getPrototypeOf(this)
const parentProto = Object.getPrototypeOf(proto)
if (stateDiagram.has(parentProto)) {
  parent.stateDiagram.forEach(line => result.add(line))
  parent.allStates.forEach(s => allState.add(s))
}
stateConfig.forEach(({ from, to, action }) => {
  // 添加当前类的边
})
```

## allStates

`allStates`（通过 `Object.defineProperties` 缓存）包含所有已知状态：

- 所有 `from` 和 `to` 状态
- 所有 `action + 'ing'` 中间态

用于 `from: []` 时生成「从所有状态到中间态」的边。

## 注意事项

### 装饰器元数据是按 prototype 存储的

```ts
const a = new Base()
const b = new Advanced()
a.stateDiagram   // 只有 Base 的边
b.stateDiagram   // Base + Advanced 的边
```

### 缓存不可变

`Object.defineProperties` 把 `stateDiagram` 和 `allStates` 定义为 `value` 属性（不可写、不可配置）。首次访问后，再添加新的 `@ChangeState` 不会更新缓存。

:::caution
不要在运行时动态添加 `@ChangeState`（这本身也不被 TS 装饰器支持）。所有迁移边在类定义时就固定。
:::

### 子类不能重写父类的迁移

如果子类定义同名方法，TS 装饰器会在子类 prototype 上注册新的元数据，但父类的元数据仍在父类 prototype。`stateDiagram` getter 会同时读到两者，可能导致重复边（被 `Set` 去重）。

## 下一步

- [API: FSM.stateDiagram](../api/fsm#statediagram-string)
- [可视化状态图](../guide/visualization)
