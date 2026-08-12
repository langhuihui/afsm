---
title: "What is AFSM"
description: "AFSM is a TypeScript decorator library for automatically managing async state machines with intermediate, success, and failure states."
---


AFSM (Automatic Finite State Machine) is a TypeScript decorator library for **automatically managing async state machines**.

## Why

Anyone who has written async flows has hit this problem: an async operation often has "in progress", "success", and "failure" states, and managing them by hand is tedious and error-prone.

```ts
// Manual state management
class Service {
  state = 'idle'
  async fetch() {
    this.state = 'fetching'
    try {
      const data = await api()
      this.state = 'success'
      return data
    } catch (e) {
      this.state = 'error'
      throw e
    }
  }
}
```

Every method repeats the same "set state → try/catch → change state" boilerplate, and as methods multiply the relationships between states become hard to track.

## AFSM's approach

AFSM hands this boilerplate to decorators. You declare **from which state to which state**, and the intermediate state, event dispatch, and error rollback are all automatic.

```ts
import { FSM, ChangeState } from 'afsm'

class Service extends FSM {
  @ChangeState('idle', 'success')
  async fetch() {
    return await api()      // failure auto-rolls back to idle
  }
}
```

When `fetch()` is called, AFSM will:

1. Check that the current state is `idle`, otherwise throw `FSMError`
2. Enter the intermediate state `fetching` (auto-appends `ing`)
3. Run the original method
4. Success → state becomes `success`; failure → state rolls back to `idle` and the error is thrown
5. Throughout, events are dispatched via `eventemitter3` so listeners can react in real time

## Core features

- **`@ChangeState(from, to)`** — state transition decorator, auto-manages intermediate states
- **`@Includes` / `@Excludes`** — state guards, restrict method calls to specific states
- **`@ActionState`** — action state, temporarily switch to a state during async, return to old state after
- **`FSM.stateDiagram`** — auto-generates a mermaid state diagram for visualizing the topology
- **`context`** — compose multiple independent state machines in one class
- **`abortAction`** — interrupt an in-flight MiddleState
- **DevTools extension** — a Chrome DevTools panel to inspect running state machines live

## Use cases

- Network connection management (connect / disconnect / reconnect)
- Data fetching with retry
- Any "finite state + async transition" business flow
- Complex state machines that need visualization and observability

Next, head to [Quick Start](./getting-started) to write your first state machine.
