---
title: "tryChangeState"
---


:::caution
`tryChangeState` 在源码中只是调用了 `ChangeState(from, to, opt)` 工厂函数，但**没有把它应用到任何方法上**——工厂返回的装饰器函数被直接丢弃。因此该函数实际上不做任何事情。

保留它是为了向后兼容，不建议在新代码中使用。
:::

## 签名

```ts
function tryChangeState(
  from: string | string[],
  to: string,
  opt?: ChangeOption
): void
```

## 源码

```ts
export function tryChangeState(
  from: string | string[],
  to: string,
  opt: ChangeOption = { ignoreError: true }
) {
  ChangeState(from, to, opt)
}
```

`ChangeState(from, to, opt)` 返回一个 `(target, propertyKey, descriptor) => void` 装饰器函数，但 `tryChangeState` 既不返回它，也不应用它。

## 如果你需要「尝试变更」

请直接使用 `@ChangeState` 配合 `ignoreError: true`：

```ts
@ChangeState('idle', 'done', { ignoreError: true })
async fetch() {
  await mayFail()
}
```

失败时会返回 `FSMError` 而非 reject，状态自动回滚。

## 参见

- [@ChangeState](./change-state)
- [ChangeOption.ignoreError](./types#changeoption)
