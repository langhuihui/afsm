---
title: "API Reference"
---


All public APIs are exported from the `afsm` package.

## Exports

```ts
import {
  FSM,                  // base class
  ChangeState,          // state transition decorator
  tryChangeState,      // see note (effectively a no-op)
  Includes,             // state guard: include
  Excludes,             // state guard: exclude
  ActionState,          // action state decorator
  MiddleState,          // intermediate state class
  FSMError,             // error class
  // types
  type State,
  type IFSM,
  type ChangeOption
} from 'afsm'
```

## Sections

- [FSM class](./fsm) — base class, static constants, instance properties
- [@ChangeState](./change-state) — decorator signature and `ChangeOption`
- [@ActionState](./action-state) — action state decorator
- [@Includes / @Excludes](./includes-excludes) — state guards
- [MiddleState](./middle-state) — intermediate state class
- [FSMError](./fsm-error) — error class
- [tryChangeState](./try-change-state) — caveats
- [Types](./types) — `State`, `IFSM`, `ChangeOption`

## Quick reference

### Constants

| Constant | Value | Description |
| --- | --- | --- |
| `FSM.STATECHANGED` | `'stateChanged'` | state change event name |
| `FSM.UPDATEAFSM` | `'updateAFSM'` | DevTools update event name |
| `FSM.INIT` | `'[*]'` | initial state |
| `FSM.ON` | `'on'` | generic "on" state |
| `FSM.OFF` | `'off'` | generic "off" state |

### Static methods

| Method | Description |
| --- | --- |
| `FSM.get(context)` | get the FSM associated with a context (composition) |
| `FSM.getState(context)` | directly fetch a context's state |
