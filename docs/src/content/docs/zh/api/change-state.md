---
title: "@ChangeState"
description: "@ChangeState 装饰器 API：from/to、ChangeOption、中间态与同步模式配置。"
---


## 签名

```ts
function ChangeState(
  from: string | string[],
  to: string,
  opt?: ChangeOption
): (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => void
```

## 参数

### `from: string | string[]`

允许的起始状态。

| 取值 | 含义 |
| --- | --- |
| `'idle'` | 仅 `'idle'` 可调用 |
| `['a', 'b']` | `'a'` 或 `'b'` 均可 |
| `FSM.INIT` | 即 `'[*]'`，初始状态 |
| `[]`（空数组） | 任意状态均可，且会中断进行中的 `MiddleState` |

不匹配时抛出 `FSMError`：

```
{className} {action} to {to} failed: current state {state} not from {from}
```

### `to: string`

目标状态。成功迁移后的稳定状态名。

### `opt?: ChangeOption`

详见 [ChangeOption](./types#changeoption)。

## 装饰行为

被装饰的方法被替换为以下流程：

1. 若 `opt.context` 设置，`fsm = FSM.get(context)`（组合模式）
2. 若当前已是 `to`：直接返回（异步模式 `Promise.resolve(cached)`，同步模式返回 `cached`）
3. 若当前是 `MiddleState` 且 `opt.abortAction` 匹配：调用 `middle.abort(fsm)`
4. 校验 `from`，不匹配则返回错误（reject / 抛出 / 返回，取决于 `ignoreError` 与 `sync`）
5. 创建 `MiddleState(old, to, action)`，调用 `setState(middle)`（进入中间态）
6. 执行原方法
   - 返回 Promise：`.then(success).catch(failed)`
   - 返回同步值：`success(result)`（异步模式包 `Promise.resolve`，同步模式直接返回）
7. `success`：缓存结果，若未被 abort 则 `setState(to)`，触发 `opt.success`
8. `failed`：`setState(old, err)`，触发 `opt.fail`，返回错误

## stateDiagram 元数据

`@ChangeState` 在应用时会向模块级 `stateDiagram` Map 注册 `{from, to, action}` 元数据（仅当未设置 `opt.context` 时），供 `FSM.prototype.stateDiagram` getter 生成 mermaid 边。

## 示例

```ts
class Conn extends FSM {
  @ChangeState(FSM.INIT, 'connected', {
    action: 'connect',
    success: (r) => console.log('connected'),
    fail: (e) => console.error(e)
  })
  async connect() {
    return await api()
  }
}
```

## 参见

- [ChangeOption 类型](./types#changeoption)
- [MiddleState](./middle-state)
- [FSMError](./fsm-error)
- [指南：@ChangeState](../guide/change-state)
