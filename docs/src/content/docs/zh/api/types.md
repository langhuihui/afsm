---
title: "类型定义"
---


## State

```ts
export type State = string | MiddleState
```

FSM 的状态。稳定状态是字符串（如 `'idle'`、`FSM.INIT`）；中间过渡状态是 `MiddleState` 实例。

`state.toString()` 总是返回字符串形式：

- 字符串状态：返回自身
- `MiddleState`：返回 `${action}ing`

## IFSM

```ts
export interface IFSM extends FSM {}
```

`FSM` 的自引用接口。主要用于装饰器内部的类型签名（避免循环引用）。日常使用直接 `extends FSM` 即可。

## ChangeOption

`@ChangeState` 的配置对象。

```ts
export interface ChangeOption {
  ignoreError?: boolean
  action?: string
  success?: (result: any) => any
  fail?: (err: FSMError) => any
  context?: ((this: IFSM, ...args: any[]) => string | object) | string | object
  abortAction?: string
  sync?: boolean
}
```

### `ignoreError?: boolean`

失败时不抛错，而是返回错误对象。

- 异步模式：`Promise.resolve(err)`
- 同步模式：直接 `return err`

默认 `false`。

### `action?: string`

自定义动作名。默认使用被装饰方法的方法名。中间态名 = `action + 'ing'`。

### `success?: (result: any) => any`

成功回调。`this` 指向被装饰方法所属实例。参数为原方法的返回值。

### `fail?: (err: FSMError) => any`

失败回调。`this` 指向实例。参数为 `FSMError`。

### `context?: string | object | ((this, ...args) => string | object)`

组合模式：把状态变更委托给另一个与 `context` 关联的 FSM（通过 `FSM.get(context)` 获取或创建）。

- 字符串：`FSM.get('timer')`
- 对象：`FSM.get(obj)`（用 `WeakMap`）
- 函数：`this.context.call(this, ...args)` 返回字符串或对象

详见[组合式状态机](../advanced/composition)。

### `abortAction?: string`

如果当前正处在中间态，且该中间态的 `action` 等于 `abortAction`，调用此方法会调用 `middle.abort(fsm)` 中断它。

详见[中断与 abort](../advanced/abort)。

### `sync?: boolean`

同步模式。详见[同步模式](../advanced/sync-mode)。

- `true`：方法返回同步值时直接返回（不包 `Promise`）；错误抛出而非 reject
- `false`（默认）：始终返回 `Promise`

## FSMEventTypes

```ts
interface FSMEventTypes {
  stateChanged: [State, State, any]
}
```

`stateChanged` 事件的参数类型：`[newState, oldState, err?]`。通过 `FSM<MyEvents>` 泛型可扩展自定义事件类型。

## 参见

- [FSM 类](./fsm)
- [MiddleState](./middle-state)
- [FSMError](./fsm-error)
