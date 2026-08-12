---
title: "@ChangeState"
description: "@ChangeState decorator API: from/to, ChangeOption, intermediate states, and sync mode."
---


## Signature

```ts
function ChangeState(
  from: string | string[],
  to: string,
  opt?: ChangeOption
): (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => void
```

## Parameters

### `from: string | string[]`

Allowed starting state(s).

| Value | Meaning |
| --- | --- |
| `'idle'` | only `'idle'` |
| `['a', 'b']` | either `'a'` or `'b'` |
| `FSM.INIT` | i.e. `'[*]'`, the initial state |
| `[]` (empty) | any state, and aborts an in-flight `MiddleState` |

On mismatch, throws `FSMError`:

```
{className} {action} to {to} failed: current state {state} not from {from}
```

### `to: string`

Target state. The stable state after a successful transition.

### `opt?: ChangeOption`

See [ChangeOption](./types#changeoption).

## Decorated behavior

The decorated method is replaced with this flow:

1. If `opt.context` is set, `fsm = FSM.get(context)` (composition mode)
2. If already in `to`: return immediately (async: `Promise.resolve(cached)`, sync: `cached`)
3. If currently in a `MiddleState` matching `opt.abortAction`: call `middle.abort(fsm)`
4. Validate `from`; on mismatch return the error (reject / throw / return, depending on `ignoreError` and `sync`)
5. Create `MiddleState(old, to, action)` and call `setState(middle)` (enter intermediate)
6. Run the original method
   - Returns Promise: `.then(success).catch(failed)`
   - Returns sync value: `success(result)` (async wraps `Promise.resolve`, sync returns directly)
7. `success`: cache result; if not aborted, `setState(to)`; trigger `opt.success`
8. `failed`: `setState(old, err)`; trigger `opt.fail`; return the error

## stateDiagram metadata

When applied, `@ChangeState` registers `{from, to, action}` metadata in the module-level `stateDiagram` Map (only when `opt.context` is not set), for the `FSM.prototype.stateDiagram` getter to generate mermaid edges.

## Example

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

## See also

- [ChangeOption type](./types#changeoption)
- [MiddleState](./middle-state)
- [FSMError](./fsm-error)
- [Guide: @ChangeState](../guide/change-state)
