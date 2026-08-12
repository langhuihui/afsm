---
title: "React Integration"
description: "Subscribe to FSM.STATECHANGED in React with useSyncExternalStore or useEffect."
---


To use AFSM in React, typically subscribe to `FSM.STATECHANGED` via `useSyncExternalStore` or `useEffect`.

## Basic usage

```tsx
import { FSM, ChangeState } from 'afsm'
import { useSyncExternalStore } from 'react'

class Counter extends FSM {
  count = 0
  @ChangeState('idle', 'counting')
  async increment() {
    this.count++
  }
}

const counter = new Counter('counter')

function useFSMState(fsm: FSM) {
  return useSyncExternalStore(
    (cb) => {
      fsm.on(FSM.STATECHANGED, cb)
      return () => fsm.off(FSM.STATECHANGED, cb)
    },
    () => fsm.state.toString()
  )
}

function App() {
  const state = useFSMState(counter)
  return (
    <div>
      <p>state: {state}</p>
      <p>count: {counter.count}</p>
      <button onClick={() => counter.increment()}>+1</button>
    </div>
  )
}
```

## useReducer pattern

If you can't use `useSyncExternalStore` (React 18+), force re-renders with `useReducer`:

```tsx
function useFSM(fsm: FSM) {
  const [, force] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    fsm.on(FSM.STATECHANGED, force)
    return () => fsm.off(FSM.STATECHANGED, force)
  }, [fsm])
  return fsm
}
```

## Global singletons

FSM instances are typically module-level singletons:

```tsx
// store.ts
import { FSM, ChangeState } from 'afsm'
class AuthFSM extends FSM {
  user?: User
  @ChangeState(FSM.INIT, 'loggedIn')
  async login(token: string) {
    this.user = await fetchUser(token)
  }
  @ChangeState('loggedIn', FSM.INIT)
  async logout() {}
}
export const auth = new AuthFSM('auth')

// App.tsx
import { auth } from './store'
function Header() {
  const state = useFSMState(auth)
  return <header>{state === 'loggedIn' ? `Hi ${auth.user?.name}` : 'Login'}</header>
}
```

## Intermediate states & UI

AFSM's intermediate states are great for driving UI:

```tsx
function LoginButton() {
  const state = useFSMState(auth)
  const isLoggingIn = state === 'logining'  // MiddleState.toString()
  return (
    <button disabled={isLoggingIn} onClick={() => auth.login(token)}>
      {isLoggingIn ? 'Logging in...' : 'Login'}
    </button>
  )
}
```

## vs React Query / SWR

AFSM is not a data-fetching library — it's a state-machine library. It's great when:

- You need explicit state enumerations (idle/loading/success/error)
- States have strict transition constraints
- You need visualization and observability

Data fetching can compose with AFSM: use AFSM for UI state, React Query for caching.

## Next steps

- [Vue Integration](./vue-integration)
- [Event System](../guide/events)
