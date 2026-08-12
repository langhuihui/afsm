---
title: "Core Concepts"
description: "Core AFSM concepts: the FSM base class, states and MiddleState, decorator-driven transitions, and events."
---


## The FSM class

`FSM` is the base class for all state machines, extending `eventemitter3`'s `EventEmitter`.

```ts
import { FSM } from 'afsm'

class MyFSM extends FSM {
  // your states and methods
}

const obj = new MyFSM('my-fsm') // optional name
```

### Key members

| Member | Description |
| --- | --- |
| `obj.state` | Current state, type `State` (string or `MiddleState`) |
| `obj.stateDiagram` | Auto-generated mermaid state diagram lines |
| `obj.name` | Instance name (shown in DevTools) |
| `obj.groupName` | Group name (defaults to class name) |
| `obj.on/off/emit` | Inherited from EventEmitter |
| `FSM.STATECHANGED` | State change event name, constant `'stateChanged'` |
| `FSM.INIT` | Initial state, constant `'[*]'` |
| `FSM.ON` / `FSM.OFF` | Generic state constants `'on'` / `'off'` |

## The State type

```ts
export type State = string | MiddleState
```

There are two kinds of state:

1. **Stable states** (strings) — e.g. `'idle'`, `'connected'`, `FSM.INIT`
2. **Intermediate states** (`MiddleState` instances) — transient during async execution, `toString()` returns `${action}ing`

For example, calling `@ChangeState('idle', 'done') async fetch()`:

- Enters intermediate state `fetching` (a `MiddleState` instance)
- On success becomes stable state `done`
- On failure rolls back to `idle`

## MiddleState

```ts
export class MiddleState {
  oldState: State
  newState: string
  action: string
  aborted: boolean
  toString() { return `${this.action}ing` }
  abort(fsm: IFSM): void
}
```

An intermediate state describes the transition "from `oldState` via `action` toward `newState`". It can be aborted via `abort()` (see [Abort & Interruption](../advanced/abort)).

## stateDiagram

`stateDiagram` is a getter that auto-generates mermaid syntax from decorator metadata. It's memoized on the prototype after first access.

```ts
const obj = new MyFSM()
console.log(obj.stateDiagram)
// [
//   "[*] --> gotoState1ing : gotoState1",
//   "gotoState1ing --> state1 : gotoState1 🟢",
//   "gotoState1ing --> [*] : gotoState1 🔴",
//   ...
// ]
```

Drop this into a mermaid `stateDiagram-v2` block to render. See [Visualizing the Diagram](./visualization).

## Instance registries

`FSM` has two static registries used by the `context` composition pattern (see [Composing FSMs](../advanced/composition)):

- `FSM.instances: Map<string, IFSM>` — string-keyed registry
- `FSM.instances2: WeakMap<object, IFSM>` — object-keyed registry
- `FSM.get(context)` — get or create the FSM associated with a context
- `FSM.getState(context)` — directly fetch a context's state

## The IFSM interface

```ts
export interface IFSM extends FSM {}
```

A self-referential interface for `FSM`, mainly used in decorator type signatures. In everyday use you just `extends FSM`.

## Next steps

- [@ChangeState](./change-state) — the transition decorator
- [Event System](./events) — listening to `stateChanged` and per-state events
