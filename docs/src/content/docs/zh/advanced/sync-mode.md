---
title: "同步模式"
description: "开启 sync: true 后，同步方法可直接返回同步值，而不总是包装为 Promise。"
---


`@ChangeState` 默认总是返回 `Promise`（即使原方法是同步的）。开启 `sync: true` 后，同步方法会直接返回同步值。

## 默认行为

```ts
@ChangeState('idle', 'ready')
init() {            // 同步方法
  return 42
}
const r = obj.init()
// r 是 Promise<number>，需要 await
```

AFSM 这样设计是为了「调用方总是 await」的一致体验。但有些场景（如构造后立即初始化）希望同步返回。

## 开启 sync

```ts
@ChangeState('idle', 'ready', { sync: true })
init() {
  return 42
}
const r = obj.init()
// r 直接是 42
```

## 错误行为

`sync` 模式下，错误会**抛出**而非 reject：

```ts
@ChangeState('idle', 'ready', { sync: true })
init() {
  throw new Error('bad')
}
try {
  obj.init()
} catch (e) {
  // e 是 FSMError
}
```

配合 `ignoreError: true`，错误会被**返回**而非抛出：

```ts
@ChangeState('idle', 'ready', { sync: true, ignoreError: true })
init() {
  throw new Error('bad')
}
const r = obj.init()
// r 是 FSMError 实例
```

## 缓存命中

如果当前已是 `to` 状态，重复调用会直接返回缓存：

```ts
@ChangeState('idle', 'ready', { sync: true })
init() { return 42 }

const a = obj.init()   // 42，状态变 ready
const b = obj.init()   // 42，来自 [cacheResult]，不重新执行
```

## 异步方法 + sync

`sync: true` 对**异步**方法（返回 Promise）的行为：

```ts
@ChangeState('idle', 'ready', { sync: true })
async fetch() {
  return await api()
}
const r = await obj.fetch()
// r 是 api() 的结果（仍是 Promise，需 await）
```

`sync` 主要影响「原方法返回同步值时」的包装方式。异步方法仍然返回 Promise。

## 总结

| `sync` | 原方法 | 返回 | 错误 |
| --- | --- | --- | --- |
| `false`（默认） | 同步 | `Promise.resolve(value)` | reject |
| `false`（默认） | 异步 | 原 Promise | reject |
| `true` | 同步 | `value` | throw |
| `true` | 异步 | 原 Promise | reject |

## 下一步

- [@ChangeState](../api/change-state)
- [ChangeOption.sync](../api/types#changeoption)
