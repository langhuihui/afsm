---
title: "Changing State: @ChangeState"
description: "@ChangeState wraps an async method as a state transition, handling intermediate states, success, and rollback."
---


`@ChangeState` is AFSM's core decorator, wrapping an async method into a "state transition action".

## Signature

```ts
function ChangeState(
  from: string | string[],
  to: string,
  opt?: ChangeOption
): MethodDecorator
```

- `from` — allowed starting state(s); array for multiple; empty array `[]` for any state
- `to` — target state
- `opt` — optional config, see below

## Basic usage

```ts
class Conn extends FSM {
  @ChangeState(FSM.INIT, 'connected')
  async connect() {
    await doConnect()       // on success, state becomes connected
  }                         // on failure, state rolls back to [*]
}
```

When `connect()` is called:

1. Validate current state ∈ `from`, otherwise throw `FSMError`
2. Enter intermediate state `connecting` (a `MiddleState` instance, `toString()` returns `'connecting'`)
3. Run the original method
4. **Success** → state becomes `to` (`'connected'`)
5. **Failure** → state rolls back to `from` (`FSM.INIT`), and the original error is rejected

## Forms of `from`

```ts
// single starting state
@ChangeState('idle', 'done')
async fetch() {}

// multiple starting states
@ChangeState([FSM.INIT, 'disconnected'], 'connected')
async connect() {}

// empty array: any state is allowed, and it aborts an in-flight MiddleState
@ChangeState([], 'disconnected')
async disconnect() {}
```

:::tip
`from: []` is great for "force reset / emergency disconnect" operations — regardless of the current state (including intermediate states), it forces a transition.
:::

## ChangeOption

```ts
interface ChangeOption {
  ignoreError?: boolean       // don't throw on failure, return the error instead
  action?: string             // custom action name (defaults to method name)
  success?: (result) => any  // success callback
  fail?: (err: FSMError) => any // failure callback
  context?: string | object | ((this, ...args) => string | object) // compose multiple FSMs
  abortAction?: string         // abort a MiddleState matching this action
  sync?: boolean               // sync mode, see Sync Mode
}
```

### ignoreError

```ts
@ChangeState('idle', 'done', { ignoreError: true })
async fetch() {
  await mayFail()
}
const r = await obj.fetch()
// on failure, r is an FSMError, not a rejection
```

### action — custom action name

By default the intermediate state name = method name + `ing`. Customize with `action`:

```ts
@ChangeState('idle', 'done', { action: 'load' })
async fetch() {}
// intermediate state is 'loading', not 'fetching'
```

### success / fail callbacks

```ts
@ChangeState('idle', 'done', {
  success: (result) => saveCache(result),
  fail: (err) => reportError(err)
})
async fetch() {}
```

Inside callbacks, `this` refers to the instance owning the decorated method.

### context — composing FSMs

When a class needs multiple independent state machines, use `context` to isolate:

```ts
class App extends FSM {
  @ChangeState(FSM.INIT, 'started', { context: 'timer' })
  async startTimer() {}

  @ChangeState('started', FSM.INIT, { context: 'timer', abortAction: 'startTimer' })
  async stopTimer() {}
}
```

See [Composing FSMs](../advanced/composition).

### abortAction — interrupting MiddleStates

If currently in a MiddleState whose `action` equals `abortAction`, calling this method aborts it:

```ts
@ChangeState('started', 'stopped', { abortAction: 'start' })
async stop() {}
```

See [Abort & Interruption](../advanced/abort).

## Sync methods

`@ChangeState` also supports sync functions: when the method returns a plain value, the transition completes immediately:

```ts
@ChangeState('idle', 'ready')
init() {        // sync method
  return 42
}
```

By default it still returns a `Promise`. To get the sync return value, enable `sync: true` (see [Sync Mode](../advanced/sync-mode)).

## Repeated calls and caching

If the current state is already `to`, calling the method returns immediately (without re-executing):

```ts
await obj.connect()   // state becomes connected
await obj.connect()   // resolves immediately, doConnect not called
```

The successful result is cached (on the `[cacheResult]` symbol), so repeated calls return the cached value.

## Next steps

- [Other Decorators](./decorators) — `@Includes` / `@Excludes` / `@ActionState`
- [Error Handling](./error-handling) — `FSMError`, `ignoreError`, `fail` callback
