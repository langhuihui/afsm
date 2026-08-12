---
title: "FSM class"
description: "FSM base class API: current state, events, stateDiagram, and EventEmitter capabilities."
---


`FSM` is the base class for all state machines, extending `eventemitter3`'s `EventEmitter`.

## Generics

```ts
class FSM<
  EventTypes extends EventEmitter.ValidEventTypes = string | symbol,
  Context extends any = any
> extends EventEmitter<EventTypes | FSMEventTypes, Context>
```

- `EventTypes` — custom event type declarations (for type-safe `emit`/`on`)
- `Context` — EventEmitter context

```ts
interface MyEvents {
  play: [url: string]
  stateChanged: [State, State, any]
}
class Player extends FSM<MyEvents> { ... }
```

## Instance properties

### `state: State`

Current state (getter). `State = string | MiddleState`.

```ts
const obj = new MyFSM()
console.log(obj.state)   // '[*]'
```

The setter also triggers `setState` (dispatches events), but usually you should change state via `@ChangeState`.

### `_state: State`

Internal state field (the backing store for `state`). Direct mutation does NOT dispatch events — use with caution.

### `stateDiagram: string[]`

Read-only getter. Auto-generates mermaid `stateDiagram-v2` lines from decorator metadata. Memoized on the prototype after first access.

### `name?: string`

Instance name, used for DevTools display. Auto-generated on construction (based on timestamp or parent name + counter).

### `groupName?: string`

Group name, defaults to `constructor.name`. Used to categorize in the DevTools tree.

## Instance methods

Inherited from `eventemitter3`:

- `on(event, cb)` — listen
- `once(event, cb)` — one-time listen
- `off(event, cb)` — remove
- `emit(event, ...args)` — dispatch
- `removeAllListeners(event?)` — remove all or specific event listeners

### `updateDevTools(payload?)`

Sends an update to the DevTools extension. Usually called automatically by `setState` — no need to call manually. The library also keeps a last-known snapshot per instance and replays it when the extension dispatches `__AFSM_DUMP__`.

## Constructor

```ts
constructor(name?: string, groupName?: string, prototype?: any)
```

- `name` — optional instance name
- `groupName` — optional group name
- `prototype` — internal use (for `FSM.get` proxy instances)

```ts
class Player extends FSM {
  constructor() {
    super('player', 'media')   // name='player', groupName='media'
  }
}
```

## Static constants

| Constant | Value |
| --- | --- |
| `FSM.STATECHANGED` | `'stateChanged'` |
| `FSM.UPDATEAFSM` | `'updateAFSM'` |
| `FSM.INIT` | `'[*]'` |
| `FSM.ON` | `'on'` |
| `FSM.OFF` | `'off'` |

## Static registries

### `FSM.instances: Map<string, IFSM>`

String-keyed instance registry, used by the `context` composition pattern.

### `FSM.instances2: WeakMap<object, IFSM>`

Object-keyed instance registry.

### `FSM.get(context: string | object): IFSM`

Get or create the FSM associated with a context. If absent, creates a minimal proxy instance via `Object.create(FSM.prototype)` and registers it.

```ts
const fsm = FSM.get('shared-timer')
const same = FSM.get('shared-timer')
console.log(fsm === same)  // true
```

### `FSM.getState(context: string | object): State`

Directly fetch a context's state (returns `undefined` if absent).

## Internal symbols

These symbols are for internal state — don't access directly in normal use:

- `[cacheResult]` — caches the last successful result
- `[abortCtrl]` — abort control (reserved)

## Next steps

- [@ChangeState](./change-state)
- [Composing FSMs](../advanced/composition) — `FSM.get` and `context` in practice
