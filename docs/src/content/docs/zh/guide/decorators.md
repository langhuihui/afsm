---
title: "其他装饰器"
description: "除 @ChangeState 外，学习 @ActionState、@Includes、@Excludes 如何约束与包装状态相关方法。"
---


除了 `@ChangeState`，AFSM 还提供三个装饰器用于不同的状态约束场景。

## @Includes —— 包含状态守卫

只允许在指定状态下调用方法。

```ts
import { Includes } from 'afsm'

class Player extends FSM {
  @Includes('playing')
  pause() {
    // 只有在 playing 状态下才能调用
    // 否则抛出 FSMError
  }
}
```

签名：

```ts
function Includes(...states: string[]): MethodDecorator
```

支持多个状态：`@Includes('playing', 'buffering')`。

## @Excludes —— 排除状态守卫

不允许在指定状态下调用方法。

```ts
import { Excludes } from 'afsm'

class Player extends FSM {
  @Excludes('disabled')
  play() {
    // 除了 disabled 状态外都可以调用
  }
}
```

签名：

```ts
function Excludes(...states: string[]): MethodDecorator
```

:::caution
`@Excludes` 会把原方法变成 `async`（即使原方法本身是同步的）。调用时总是返回 Promise。
:::

## @ActionState —— 动作态

异步执行期间临时切到某个状态，结束后**回到原状态**。

```ts
import { ActionState } from 'afsm'

class Doc extends FSM {
  @ActionState('saving')
  async save() {
    await persist()
    // 执行期间状态为 saving，结束后回到原来的状态
  }
}
```

签名：

```ts
function ActionState(name?: string): MethodDecorator
```

`name` 省略时，默认用方法名作为状态名。

### 与 @ChangeState 的区别

| | `@ChangeState` | `@ActionState` |
| --- | --- | --- |
| 执行前 | 校验 from | 无校验，直接切换 |
| 执行后 | 进入新的稳定状态 `to` | 回到原状态 |
| 中间态 | `MiddleState`（`${action}ing`） | 直接进入 `name` 状态 |
| 出现在 stateDiagram | ✅ | ❌ |

:::tip
`@ActionState` 不会出现在自动生成的 `stateDiagram` 里——它是一种「瞬态操作」，不构成状态机的正式迁移边。适合描述「保存中」「上传中」这类动作，而不是状态机的真实节点。
:::

## 组合使用

装饰器可以叠加，但要注意执行顺序——从下往上应用：

```ts
class Service extends FSM {
  @Includes('idle')              // 外层：先校验状态
  @ChangeState('idle', 'done')   // 内层：再迁移状态
  async fetch() {}
}
```

实际开发中通常单独使用即可。

## 下一步

- [事件系统](./events) — 监听状态变化
- [@ActionState API](../api/action-state) — 完整 API 参考
