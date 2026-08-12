---
title: "Inheritance"
description: "AFSM inheritance merges parent state diagrams and decorator metadata into subclasses."
---


AFSM supports inheritance. Subclasses auto-merge the parent's state diagram.

## Basic inheritance

```ts
class Base extends FSM {
  @ChangeState(FSM.INIT, 'connected')
  async connect() {}

  @ChangeState([], 'disconnected')
  async disconnect() {}
}

class Advanced extends Base {
  @ChangeState('connected', 'authenticated')
  async authenticate() {}
}
```

`Advanced`'s `stateDiagram` includes all of `Base`'s edges plus its own `authenticate` edge.

## stateDiagram merging logic

The `stateDiagram` getter, on first access:

1. Reads the decorator metadata for the current prototype (from the `stateDiagram` Map)
2. Recursively reads the parent prototype's `stateDiagram` (via `parent.stateDiagram`)
3. Merges all edges and states
4. Caches via `Object.defineProperties` on the current prototype

```ts
// simplified pseudo-code
const proto = Object.getPrototypeOf(this)
const parentProto = Object.getPrototypeOf(proto)
if (stateDiagram.has(parentProto)) {
  parent.stateDiagram.forEach(line => result.add(line))
  parent.allStates.forEach(s => allState.add(s))
}
stateConfig.forEach(({ from, to, action }) => {
  // add current class's edges
})
```

## allStates

`allStates` (also cached via `Object.defineProperties`) includes all known states:

- All `from` and `to` states
- All `action + 'ing'` intermediate states

Used by `from: []` to generate "from every state into the intermediate" edges.

## Caveats

### Decorator metadata is per-prototype

```ts
const a = new Base()
const b = new Advanced()
a.stateDiagram   // only Base's edges
b.stateDiagram   // Base + Advanced edges
```

### Cache is immutable

`Object.defineProperties` defines `stateDiagram` and `allStates` as `value` properties (non-writable, non-configurable). After first access, adding new `@ChangeState` won't update the cache.

:::caution
Don't dynamically add `@ChangeState` at runtime (TypeScript decorators don't support this anyway). All transition edges are fixed at class definition time.
:::

### Subclasses can't override parent transitions

If a subclass defines a same-named method, TS decorators register new metadata on the subclass prototype, but the parent's metadata stays on the parent prototype. The `stateDiagram` getter reads both, potentially producing duplicate edges (deduped by `Set`).

## Next steps

- [API: FSM.stateDiagram](../api/fsm#statediagram-string)
- [Visualizing the Diagram](../guide/visualization)
