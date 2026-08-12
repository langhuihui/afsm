---
title: "什么是 AFSM"
description: "AFSM 是 TypeScript 装饰器库，用 @ChangeState 等装饰器自动管理异步状态机的中间态、成功与失败迁移。"
---


AFSM（Automatic Finite State Machine）是一个 TypeScript 装饰器库，用于**自动管理异步状态机**。

## 为什么需要它

写过异步流程的同学都遇到过这样的问题：一个异步操作往往有「进行中」「成功」「失败」几种状态，而手动维护这些状态既繁琐又容易出错。

```ts
// 传统写法：手动维护状态
class Service {
  state = 'idle'
  async fetch() {
    this.state = 'fetching'
    try {
      const data = await api()
      this.state = 'success'
      return data
    } catch (e) {
      this.state = 'error'
      throw e
    }
  }
}
```

每个方法都要重复写「设状态 → try/catch → 改状态」的样板代码，方法多了之后状态之间的关系也变得难以追踪。

## AFSM 的做法

AFSM 把这些样板交给装饰器。你只需要声明**从哪个状态到哪个状态**，剩下的中间态、事件分发、错误回滚都自动完成。

```ts
import { FSM, ChangeState } from 'afsm'

class Service extends FSM {
  @ChangeState('idle', 'success')
  async fetch() {
    return await api()      // 失败会自动回到 idle
  }
}
```

调用 `fetch()` 时，AFSM 会：

1. 检查当前是否处于 `idle`，否则抛出 `FSMError`
2. 进入中间态 `fetching`（自动加 `ing` 后缀）
3. 执行原方法
4. 成功 → 状态变为 `success`；失败 → 状态回到 `idle`，并抛出错误
5. 全程通过 `eventemitter3` 分发事件，监听者可以实时感知

## 核心特性

- **`@ChangeState(from, to)`** — 状态迁移装饰器，自动管理中间态
- **`@Includes` / `@Excludes`** — 状态守卫，限制方法在特定状态下可调用
- **`@ActionState`** — 动作态，异步期间临时切到某状态，结束后回原状态
- **`FSM.stateDiagram`** — 自动生成 mermaid 状态图，可视化状态机拓扑
- **`context`** — 在一个类里组合多个独立状态机
- **`abortAction`** — 中断进行中的中间态
- **DevTools 扩展** — 浏览器开发者工具里实时观察状态机

## 适用场景

- 网络连接管理（connect / disconnect / reconnect）
- 数据请求与重试
- 任何「有限状态 + 异步转换」的业务流程
- 需要可视化与可观测性的复杂状态机

下一步前往[快速上手](./getting-started)写第一个状态机。
