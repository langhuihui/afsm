---
title: "Composing FSMs"
description: "Compose multiple independent state machines in one class with opt.context isolation."
---


A single class can contain multiple independent state machines, isolated via `opt.context`.

## Scenario

For example, an `App` class manages both a "timer" state machine and a "connection" state machine. They have independent states that don't interfere.

## Usage

```ts
class App extends FSM {
  // Timer state machine (context='timer')
  @ChangeState([FSM.INIT, FSM.OFF], FSM.ON, { context: 'timer' })
  async startTimer() {}

  @ChangeState(FSM.ON, FSM.OFF, { context: 'timer' })
  async stopTimer() {}

  // Connection state machine (context='conn')
  @ChangeState(FSM.INIT, 'connected', { context: 'conn' })
  async connect() {}
}
```

When `app.startTimer()` is called:

1. `fsm = FSM.get('timer')` (from the `FSM.instances` Map)
2. The state change happens on `fsm`, not on `app` itself

`app.state` is still `app`'s own state (likely `FSM.INIT` since no `@ChangeState` without context acts on `app`).

## FSM.get(context)

```ts
static get(context: string | object): IFSM
```

- String: from `FSM.instances` Map
- Object: from `FSM.instances2` WeakMap

If absent, creates a minimal proxy instance (`Object.create(FSM.prototype)`) and registers it.

```ts
const fsm1 = FSM.get('timer')
const fsm2 = FSM.get('timer')
console.log(fsm1 === fsm2)  // true
```

## Listening to composed FSMs

Listen on the context-associated FSM, not `app`:

```ts
const timerFsm = FSM.get('timer')
timerFsm.on(FSM.STATECHANGED, (newState) => {
  console.log('timer:', newState)
})
```

## context as a function

`context` can also be a function, dynamically decided from arguments at runtime:

```ts
@ChangeState(FSM.INIT, 'connected', {
  context: (this, url) => `conn:${url}`
})
async connect(url: string) {}
```

Each `connect(url)` gets the FSM associated with `url`.

## stateDiagram and context

`@ChangeState` with `opt.context` set does **not** register in the module-level `stateDiagram` Map (to avoid mixing edges from multiple state machines). So each sub-FSM's diagram must be fetched separately:

```ts
const timerFsm = FSM.get('timer')
console.log(timerFsm.stateDiagram)  // note: proxy instance has no decorator metadata
```

:::tip
The sub-FSMs created by `FSM.get` are proxy instances (`Object.create(FSM.prototype)`) with no decorator metadata, so their `stateDiagram` is empty. For full diagrams, define an independent `extends FSM` class per sub-state-machine.
:::

## Next steps

- [Abort & Interruption](./abort) — `abortAction` with context
- [API: ChangeOption.context](../api/types#changeoption)
