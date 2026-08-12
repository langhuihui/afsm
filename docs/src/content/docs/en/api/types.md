---
title: "Types"
description: "AFSM TypeScript types: State, ChangeOption, and other public type definitions."
---


## State

```ts
export type State = string | MiddleState
```

The FSM's state. Stable states are strings (e.g. `'idle'`, `FSM.INIT`); intermediate states are `MiddleState` instances.

`state.toString()` always returns a string form:

- String state: returns itself
- `MiddleState`: returns `${action}ing`

## IFSM

```ts
export interface IFSM extends FSM {}
```

A self-referential interface for `FSM`, mainly used in decorator type signatures (to avoid circular references). In everyday use, just `extends FSM`.

## ChangeOption

The config object for `@ChangeState`.

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

Don't throw on failure — return the error as the value instead.

- Async mode: `Promise.resolve(err)`
- Sync mode: `return err`

Defaults to `false`.

### `action?: string`

Custom action name. Defaults to the decorated method's name. Intermediate state name = `action + 'ing'`.

### `success?: (result: any) => any`

Success callback. `this` refers to the instance owning the decorated method. Receives the original method's return value.

### `fail?: (err: FSMError) => any`

Failure callback. `this` refers to the instance. Receives the `FSMError`.

### `context?: string | object | ((this, ...args) => string | object)`

Composition mode: delegate the state change to another FSM associated with `context` (via `FSM.get(context)`).

- String: `FSM.get('timer')`
- Object: `FSM.get(obj)` (uses `WeakMap`)
- Function: `this.context.call(this, ...args)` returns a string or object

See [Composing FSMs](../advanced/composition).

### `abortAction?: string`

If currently in a MiddleState whose `action` equals `abortAction`, calling this method invokes `middle.abort(fsm)`.

See [Abort & Interruption](../advanced/abort).

### `sync?: boolean`

Sync mode. See [Sync Mode](../advanced/sync-mode).

- `true`: sync return values are returned directly (not wrapped in `Promise`); errors are thrown, not rejected
- `false` (default): always returns a `Promise`

## FSMEventTypes

```ts
interface FSMEventTypes {
  stateChanged: [State, State, any]
}
```

Parameter types for the `stateChanged` event: `[newState, oldState, err?]`. Extend with custom event types via the `FSM<MyEvents>` generic.

## See also

- [FSM class](./fsm)
- [MiddleState](./middle-state)
- [FSMError](./fsm-error)
