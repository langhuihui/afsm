---
title: "Sync Mode"
---


`@ChangeState` always returns a `Promise` by default (even for sync methods). With `sync: true`, sync methods return sync values directly.

## Default behavior

```ts
@ChangeState('idle', 'ready')
init() {            // sync method
  return 42
}
const r = obj.init()
// r is Promise<number>, needs await
```

AFSM does this for a consistent "always await" caller experience. But some scenarios (e.g. init right after construction) want sync returns.

## Enabling sync

```ts
@ChangeState('idle', 'ready', { sync: true })
init() {
  return 42
}
const r = obj.init()
// r is 42 directly
```

## Error behavior

In `sync` mode, errors are **thrown** instead of rejected:

```ts
@ChangeState('idle', 'ready', { sync: true })
init() {
  throw new Error('bad')
}
try {
  obj.init()
} catch (e) {
  // e is FSMError
}
```

With `ignoreError: true`, the error is **returned** instead of thrown:

```ts
@ChangeState('idle', 'ready', { sync: true, ignoreError: true })
init() {
  throw new Error('bad')
}
const r = obj.init()
// r is an FSMError instance
```

## Cache hits

If already in `to`, repeated calls return the cache:

```ts
@ChangeState('idle', 'ready', { sync: true })
init() { return 42 }

const a = obj.init()   // 42, state becomes ready
const b = obj.init()   // 42, from [cacheResult], not re-executed
```

## Async method + sync

`sync: true` with an **async** method (returns Promise):

```ts
@ChangeState('idle', 'ready', { sync: true })
async fetch() {
  return await api()
}
const r = await obj.fetch()
// r is api()'s result (still a Promise, needs await)
```

`sync` mainly affects how sync return values are wrapped. Async methods still return Promises.

## Summary

| `sync` | Original | Returns | Errors |
| --- | --- | --- | --- |
| `false` (default) | sync | `Promise.resolve(value)` | reject |
| `false` (default) | async | original Promise | reject |
| `true` | sync | `value` | throw |
| `true` | async | original Promise | reject |

## Next steps

- [@ChangeState](../api/change-state)
- [ChangeOption.sync](../api/types#changeoption)
