---
title: "tryChangeState"
description: "Notes on tryChangeState: current implementation limits and the recommended decorator approach."
---


:::caution
`tryChangeState` in the source just calls `ChangeState(from, to, opt)` — the factory function — but **never applies it to any method**. The factory returns a decorator function which is then discarded. So this function does nothing.

It's kept for backward compatibility; don't use it in new code.
:::

## Signature

```ts
function tryChangeState(
  from: string | string[],
  to: string,
  opt?: ChangeOption
): void
```

## Source

```ts
export function tryChangeState(
  from: string | string[],
  to: string,
  opt: ChangeOption = { ignoreError: true }
) {
  ChangeState(from, to, opt)
}
```

`ChangeState(from, to, opt)` returns a `(target, propertyKey, descriptor) => void` decorator function, but `tryChangeState` neither returns it nor applies it.

## If you need "try to change state"

Use `@ChangeState` with `ignoreError: true`:

```ts
@ChangeState('idle', 'done', { ignoreError: true })
async fetch() {
  await mayFail()
}
```

On failure, an `FSMError` is returned (not rejected) and the state auto-rolls back.

## See also

- [@ChangeState](./change-state)
- [ChangeOption.ignoreError](./types#changeoption)
