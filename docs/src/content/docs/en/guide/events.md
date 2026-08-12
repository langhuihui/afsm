---
title: "Event System"
description: "AFSM extends eventemitter3 to emit STATECHANGED and related events for UI and logging."
---


AFSM extends `eventemitter3`, so state changes are dispatched as events.

## stateChanged event

Every state change triggers `FSM.STATECHANGED` (i.e. `'stateChanged'`):

```ts
obj.on(FSM.STATECHANGED, (newState, oldState, err?) => {
  console.log(`${oldState} → ${newState}`)
})
```

Parameters:

- `newState: State` — new state (string or `MiddleState`)
- `oldState: State` — old state
- `err?: any` — error carried on failure rollback

## Per-state events

Entering a stable state dispatches an event with that state name:

```ts
obj.on('connected', (oldState) => {
  console.log(`connected, old state was ${oldState}`)
})
```

## Intermediate state events

Entering an intermediate state dispatches `${action}ing`:

```ts
obj.on('connecting', () => {
  console.log('connecting...')
})
```

This lets you listen to "start connecting" and "connection done" separately:

```ts
obj.on('connecting', () => showSpinner())
obj.on('connected', () => hideSpinner())
// on failure, 'connected' won't fire
```

## One-time listeners

`eventemitter3` provides `once`:

```ts
obj.once('connected', () => {
  console.log('first connection succeeded')
})
```

## Removing listeners

```ts
const cb = (newState: State) => console.log(newState)
obj.on(FSM.STATECHANGED, cb)
obj.off(FSM.STATECHANGED, cb)
// or remove all
obj.removeAllListeners()
```

## Custom events

Your methods can emit any event via `emit` (inherited from EventEmitter):

```ts
class Timer extends FSM {
  @ChangeState(FSM.ON, FSM.OFF)
  async timeout() {
    this.emit('timeout', Date.now())
  }
}
t.on('timeout' as any, (ts: number) => console.log('fired at', ts))
```

:::tip
`eventemitter3` defaults `ValidEventTypes` to `string | symbol`, so `emit('timeout', ...)` needs `as any` unless you declare event types via `extends FSM<MyEvents>`.
:::

## Typed events via generics

```ts
interface PlayerEvents {
  play: [url: string]
  stop: []
  stateChanged: [State, State, any]
}

class Player extends FSM<PlayerEvents> {
  @ChangeState('idle', 'playing')
  async play(url: string) {
    this.emit('play', url)  // type-safe
  }
}
```

## Next steps

- [Error Handling](./error-handling) — `FSMError` in depth
- [API: FSM class](../api/fsm) — full EventEmitter interface
