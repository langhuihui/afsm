---
title: "@Includes / @Excludes"
description: "@Includes / @Excludes guards: allow or block method calls based on the current state."
---


State guard decorators that restrict method calls to specific states.

## @Includes

```ts
function Includes(...states: string[]): MethodDecorator
```

Only allows the call when the current state is in `states`, otherwise throws `FSMError`.

```ts
class Player extends FSM {
  @Includes('playing')
  pause() {
    // only callable in the playing state
  }
}
```

Error message:

```
{className} {action} failed: current state {state} not in {states}
```

`this.state.toString()` is used for comparison (so intermediate states' `toString()` participates).

## @Excludes

```ts
function Excludes(...states: string[]): MethodDecorator
```

Disallows the call when the current state is in `states`.

```ts
class Player extends FSM {
  @Excludes('disabled')
  play() {
    // callable in any state except disabled
  }
}
```

:::caution
`@Excludes` turns the method into `async` (even if the original is sync), so calls always return a Promise. This keeps error-handling semantics consistent with async methods (`throw` becomes a rejected Promise).
:::

## Multiple states

```ts
@Includes('playing', 'buffering')
pause() {}

@Excludes('disabled', 'errored')
play() {}
```

## Combining with @ChangeState

Decorators stack, applied bottom-up:

```ts
@Includes('idle')              // outer: validate first
@ChangeState('idle', 'done')   // inner: then transition
async fetch() {}
```

Usually you'll use them alone — `@ChangeState` already includes `from` validation.

## See also

- [Guide: Other Decorators](../guide/decorators)
- [FSMError](./fsm-error)
