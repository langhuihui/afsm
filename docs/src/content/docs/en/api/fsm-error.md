---
title: "FSMError"
description: "FSMError is the error type AFSM throws when a state transition fails, with contextual details."
---


The error type thrown by AFSM, extending `Error`.

## Definition

```ts
export class FSMError extends Error {
  state: State        // state at the time of error
  message: string
  cause?: Error       // original error (if any)

  constructor(state: State, message: string, cause?: Error)
}
```

## Fields

| Field | Description |
| --- | --- |
| `state` | The FSM's state when the error occurred (usually `oldState`, since state rolls back) |
| `message` | Error message |
| `cause` | Original error. When the method throws, the original `Error` is wrapped as `cause` |

## When thrown

### State validation failure

`@ChangeState`'s `from` doesn't match:

```ts
@ChangeState('idle', 'done')
async fetch() {}

await obj.fetch()  // not in idle
// FSMError: MyFSM fetch to done failed: current state [*] not from idle
// err.state === '[*]'
```

### Method execution failure

When the original method throws, it's wrapped in `FSMError`:

```ts
@ChangeState('idle', 'done')
async fetch() {
  throw new Error('network')
}
try { await obj.fetch() } catch (e) {
  if (e instanceof FSMError) {
    e.cause  // Error: network
    e.state  // 'idle' (rolled back)
  }
}
```

### State guard failure

`@Includes` / `@Excludes` not satisfied:

```ts
@Includes('playing')
pause() {}   // not in playing
// FSMError: Player pause failed: current state [*] not in playing
```

## Checking FSMError

```ts
import { FSMError } from 'afsm'

try {
  await obj.fetch()
} catch (e) {
  if (e instanceof FSMError) {
    // it's an AFSM-thrown error
  }
}
```

## ignoreError behavior

With `opt.ignoreError: true`, the error is **not rejected/thrown** — it's returned as the value:

- Async mode: `return Promise.resolve(err)`
- Sync mode: `return err`

```ts
@ChangeState('idle', 'done', { ignoreError: true })
async fetch() {
  throw new Error('x')
}
const r = await obj.fetch()
r instanceof FSMError  // true
```

## See also

- [Guide: Error Handling](../guide/error-handling)
- [ChangeOption](./types#changeoption)
