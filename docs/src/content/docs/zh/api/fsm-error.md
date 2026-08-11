---
title: "FSMError"
---


AFSM 抛出的错误类型，继承自 `Error`。

## 定义

```ts
export class FSMError extends Error {
  state: State        // 发生错误时的状态
  message: string     // 错误信息
  cause?: Error       // 原始错误（如果有）

  constructor(state: State, message: string, cause?: Error)
}
```

## 字段

| 字段 | 说明 |
| --- | --- |
| `state` | 发生错误时 FSM 的状态（通常是 `oldState`，因为状态会回滚） |
| `message` | 错误信息 |
| `cause` | 原始错误。方法执行抛错时，原 `Error` 被包装为 `cause` |

## 抛出场景

### 状态校验失败

`@ChangeState` 的 `from` 不匹配：

```ts
@ChangeState('idle', 'done')
async fetch() {}

await obj.fetch()  // 当前不是 idle
// FSMError: MyFSM fetch to done failed: current state [*] not from idle
// err.state === '[*]'
```

### 方法执行失败

原方法抛错时，包装为 `FSMError`：

```ts
@ChangeState('idle', 'done')
async fetch() {
  throw new Error('network')
}
try { await obj.fetch() } catch (e) {
  if (e instanceof FSMError) {
    e.cause  // Error: network
    e.state  // 'idle'（已回滚）
  }
}
```

### 状态守卫失败

`@Includes` / `@Excludes` 不满足：

```ts
@Includes('playing')
pause() {}   // 当前不在 playing
// FSMError: Player pause failed: current state [*] not in playing
```

## 判断 FSMError

```ts
import { FSMError } from 'afsm'

try {
  await obj.fetch()
} catch (e) {
  if (e instanceof FSMError) {
    // 是 AFSM 抛出的错误
  }
}
```

## ignoreError 的行为

`opt.ignoreError: true` 时，错误**不会 reject / throw**，而是作为返回值：

- 异步模式：`return Promise.resolve(err)`
- 同步模式：`return err`

```ts
@ChangeState('idle', 'done', { ignoreError: true })
async fetch() {
  throw new Error('x')
}
const r = await obj.fetch()
r instanceof FSMError  // true
```

## 参见

- [指南：错误处理](../guide/error-handling)
- [ChangeOption](./types#changeoption)
