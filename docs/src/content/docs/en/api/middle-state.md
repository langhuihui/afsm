---
title: "MiddleState"
description: "MiddleState represents an in-flight transition with oldState, action, and newState."
---


An intermediate transition state. Represents "in the process of going from `oldState` via `action` toward `newState`".

## Definition

```ts
export class MiddleState {
  oldState: State
  newState: string
  action: string
  aborted: boolean = false

  constructor(oldState: State, newState: string, action: string)
  abort(fsm: IFSM): void
  toString(): string   // returns `${action}ing`
}
```

## Fields

| Field | Description |
| --- | --- |
| `oldState` | starting state |
| `newState` | target state (the stable state after success) |
| `action` | action name (defaults to the decorated method name; overridable via `opt.action`) |
| `aborted` | whether it has been aborted |

## toString

```ts
const m = new MiddleState('idle', 'done', 'fetch')
m.toString()   // 'fetching'
```

The `state` property returns this `MiddleState` instance during the intermediate phase, but `state.toString()` always returns the string form.

## abort

```ts
abort(fsm: IFSM): void
```

Aborts this intermediate state:

1. Sets `aborted = true`
2. Calls `setState.call(fsm, oldState, new Error("action '{action}' aborted"))`
3. State rolls back to `oldState`; `stateChanged` event fires (with error)

After abort, if the original method is still running, its `success` callback checks `middle.aborted` and skips `setState(to)` if aborted.

## When it appears

Created automatically when a `@ChangeState`-decorated method is called:

```ts
@ChangeState('idle', 'done')
async fetch() {
  // here this.state is MiddleState('idle', 'done', 'fetch')
  // this.state.toString() === 'fetching'
}
```

## Listening to intermediate states

Intermediate states dispatch an event with name `${action}ing`:

```ts
obj.on('fetching', (oldState) => {
  console.log('fetch started, old state', oldState)
})
```

They also appear as the `newState` parameter of the `stateChanged` event (as a `MiddleState` instance).

## See also

- [Abort & Interruption](../advanced/abort)
- [@ChangeState](./change-state)
- [State type](./types)
