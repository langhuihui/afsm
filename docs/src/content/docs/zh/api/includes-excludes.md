---
title: "@Includes / @Excludes"
description: "@Includes / @Excludes 状态守卫：限制方法仅在允许或排除的状态下可调用。"
---


状态守卫装饰器，限制方法在特定状态下可调用。

## @Includes

```ts
function Includes(...states: string[]): MethodDecorator
```

只允许在 `states` 中包含当前状态时调用，否则抛出 `FSMError`。

```ts
class Player extends FSM {
  @Includes('playing')
  pause() {
    // 只有 playing 状态下才能调用
  }
}
```

错误信息：

```
{className} {action} failed: current state {state} not in {states}
```

`this.state.toString()` 用于比较（因此中间态的 `toString()` 也会参与判断）。

## @Excludes

```ts
function Excludes(...states: string[]): MethodDecorator
```

不允许在 `states` 中包含当前状态时调用。

```ts
class Player extends FSM {
  @Excludes('disabled')
  play() {
    // 除了 disabled 状态都可以
  }
}
```

:::caution
`@Excludes` 会把方法变为 `async`（即使原方法是同步的），调用总是返回 Promise。这是为了与异步方法保持一致的错误处理语义（`throw` 会被包成 rejected Promise）。
:::

## 多状态

```ts
@Includes('playing', 'buffering')
pause() {}

@Excludes('disabled', 'errored')
play() {}
```

## 与 @ChangeState 组合

可叠加使用，装饰器从下往上应用：

```ts
@Includes('idle')              // 外层：先校验
@ChangeState('idle', 'done')   // 内层：再迁移
async fetch() {}
```

通常单独使用即可，`@ChangeState` 本身已包含 `from` 校验。

## 参见

- [指南：其他装饰器](../guide/decorators)
- [FSMError](./fsm-error)
