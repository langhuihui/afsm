---
title: "Abort & Interruption"
---


AFSM supports aborting an in-flight `MiddleState`.

## abortAction

`@ChangeState`'s `opt.abortAction` aborts a MiddleState matching a specific action:

```ts
class Player extends FSM {
  @ChangeState(FSM.INIT, 'started', { abortAction: undefined })
  async start() {
    await longRunning()   // during this, state is 'starting' (MiddleState)
  }

  @ChangeState('started', 'stopped', { abortAction: 'start' })
  async stop() {
    // if currently in the 'starting' MiddleState, middle.abort(fsm) is called first
  }
}
```

When `stop()` is called while in a `MiddleState` with `action='start'`:

1. `middle.abort(fsm)` is called
2. `middle.aborted = true`
3. `setState(oldState, new Error("action 'start' aborted"))` — state rolls back to the pre-`start` state
4. `stop()`'s own `from` validation then fails (since state went back to pre-`start`, which likely isn't `'started'`)

## from: [] auto-aborts

`from: []` (any state) auto-aborts an in-flight MiddleState:

```ts
@ChangeState([], 'reset')
async reset() {}
```

Regardless of the current intermediate state, it's aborted first (`middle.abort(fsm)`), then forced into `reset`.

## MiddleState.abort

```ts
class MiddleState {
  aborted: boolean = false
  abort(fsm: IFSM): void
}
```

`abort(fsm)`:

1. `this.aborted = true`
2. `setState.call(fsm, this.oldState, new Error("action '{action}' aborted"))`
3. State rolls back to `oldState`; `stateChanged` fires (with error)

After abort, if the original method is still running, its `success` callback checks `middle.aborted`:

```ts
const success = (result: any) => {
  fsm[cacheResult] = result
  if (!middle.aborted) {        // if aborted, don't switch to `to`
    setState.call(fsm, to)
    opt.success?.call(this, fsm[cacheResult])
  }
  return result
}
```

Note: `abort()` does **not** cancel the original method's execution (it can't cancel a Promise). It only prevents the state from switching to `to` and rolls back to `oldState`. If the method holds resources, you must clean them up yourself.

## Listening to aborts

Aborts trigger `stateChanged` with `err` carrying `Error("action '...' aborted")`:

```ts
obj.on(FSM.STATECHANGED, (newState, oldState, err) => {
  if (err && err.message.includes('aborted')) {
    console.log('aborted:', err.message)
  }
})
```

## Example scenarios

- User clicks "stop" to abort an in-flight "start"
- Network drops → force reset (`from: []`)
- Switching pages → cancel incomplete requests

## Next steps

- [Sync Mode](./sync-mode)
- [API: MiddleState.abort](../api/middle-state#abort)
