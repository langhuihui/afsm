---
title: "React 集成"
---


在 React 中使用 AFSM，通常需要用 `useSyncExternalStore` 或 `useEffect` 订阅 `FSM.STATECHANGED`。

## 基本用法

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

## useReducer 模式

如果不依赖 `useSyncExternalStore`（React 18+），可以用 `useReducer` 强制更新：

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

## 全局单例

FSM 实例通常作为模块级单例：

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

## 中间态与 UI

AFSM 的中间态非常适合驱动 UI：

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

## 与 React Query / SWR 对比

AFSM 不是数据获取库，而是状态机库。它适合：

- 需要明确状态枚举（idle/loading/success/error）的流程
- 状态间有严格迁移约束
- 需要可视化与可观测性

数据获取可以与 AFSM 结合：用 AFSM 管理 UI 状态，用 React Query 管理缓存。

## 下一步

- [Vue 集成](./vue-integration)
- [事件系统](../guide/events)
