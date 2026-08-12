---
title: "Other Decorators"
description: "Beyond @ChangeState: use @ActionState, @Includes, and @Excludes for action and guard constraints."
---


Besides `@ChangeState`, AFSM provides three decorators for different state-constraint scenarios.

## @Includes — include-state guard

Only allow the method to be called when in one of the specified states.

```ts
import { Includes } from 'afsm'

class Player extends FSM {
  @Includes('playing')
  pause() {
    // only callable in the playing state
    // otherwise throws FSMError
  }
}
```

Signature:

```ts
function Includes(...states: string[]): MethodDecorator
```

Multiple states: `@Includes('playing', 'buffering')`.

## @Excludes — exclude-state guard

Disallow calling the method in the specified states.

```ts
import { Excludes } from 'afsm'

class Player extends FSM {
  @Excludes('disabled')
  play() {
    // callable in any state except disabled
  }
}
```

Signature:

```ts
function Excludes(...states: string[]): MethodDecorator
```

:::caution
`@Excludes` turns the method into an `async` function (even if the original is sync). Calls always return a Promise.
:::

## @ActionState — action state

Temporarily switch to a state during async execution, then **return to the original state** after.

```ts
import { ActionState } from 'afsm'

class Doc extends FSM {
  @ActionState('saving')
  async save() {
    await persist()
    // during execution the state is 'saving'; after, it returns to the original
  }
}
```

Signature:

```ts
function ActionState(name?: string): MethodDecorator
```

If `name` is omitted, the method name is used as the state name.

### vs @ChangeState

| | `@ChangeState` | `@ActionState` |
| --- | --- | --- |
| Before execution | validates `from` | no validation, switches directly |
| After execution | enters new stable state `to` | returns to original state |
| Intermediate | `MiddleState` (`${action}ing`) | enters `name` directly |
| Appears in stateDiagram | ✅ | ❌ |

:::tip
`@ActionState` does NOT appear in the auto-generated `stateDiagram` — it's a transient operation, not a formal edge. Good for "saving", "uploading" actions rather than real nodes.
:::

## Combining decorators

Decorators can stack, applied bottom-up:

```ts
class Service extends FSM {
  @Includes('idle')              // outer: validate state first
  @ChangeState('idle', 'done')   // inner: then transition
  async fetch() {}
}
```

Usually you'll use them individually.

## Next steps

- [Event System](./events)
- [@ActionState API](../api/action-state)
