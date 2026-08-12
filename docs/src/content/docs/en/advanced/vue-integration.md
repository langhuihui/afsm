---
title: "Vue Integration"
description: "Use Vue 3 reactive or ref subscriptions with AFSM to drive reactive UI."
---


In Vue 3, use `reactive` wrappers or `ref`-based subscriptions with AFSM.

## Basic usage

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { FSM, ChangeState } from 'afsm'

class Counter extends FSM {
  count = 0
  @ChangeState('idle', 'counting')
  async increment() {
    this.count++
  }
}

const counter = new Counter('counter')
const state = ref(counter.state.toString())

const onChange = (newState: any) => {
  state.value = newState.toString()
}

onMounted(() => counter.on(FSM.STATECHANGED, onChange))
onUnmounted(() => counter.off(FSM.STATECHANGED, onChange))
</script>

<template>
  <p>state: {{ state }}</p>
  <p>count: {{ counter.count }}</p>
  <button @click="counter.increment()">+1</button>
</template>
```

## Composable

Wrap a `useFSM`:

```ts
import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { FSM, type State } from 'afsm'

export function useFSMState(fsm: FSM): Ref<string> {
  const state = ref(fsm.state.toString())
  const cb = (newState: State) => {
    state.value = newState.toString()
  }
  onMounted(() => fsm.on(FSM.STATECHANGED, cb))
  onUnmounted(() => fsm.off(FSM.STATECHANGED, cb))
  return state
}
```

Usage:

```vue
<script setup lang="ts">
const state = useFSMState(counter)
</script>
<template>
  <p>{{ state }}</p>
</template>
```

## Intermediate states & UI

```vue
<template>
  <button :disabled="state === 'logining'" @click="auth.login(token)">
    {{ state === 'logining' ? 'Logging in...' : 'Login' }}
  </button>
</template>
```

## Pinia integration

AFSM coexists with Pinia — let FSM manage state machines, Pinia manage global stores:

```ts
import { defineStore } from 'pinia'
import { FSM, ChangeState } from 'afsm'

class AuthFSM extends FSM {
  user?: User
  @ChangeState(FSM.INIT, 'loggedIn')
  async login(token: string) {
    this.user = await fetchUser(token)
  }
}

export const useAuthStore = defineStore('auth', () => {
  const auth = new AuthFSM('auth')
  return { auth }
})
```

## This site's Playground is Vue

The Playground component on this site is built with Vue 3 + AFSM:

```vue
<!-- simplified -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FSM } from 'afsm'

const fsm = ref<FSM | null>(null)
const history = ref<any[]>([])

function run(example: any) {
  const inst = example.create()
  inst.on(FSM.STATECHANGED, (newState, oldState) => {
    history.value.push({ newState, oldState, time: Date.now() })
  })
  fsm.value = inst
  example.run(inst)
}
</script>
```

Full source on [GitHub](https://github.com/langhuihui/afsm/tree/main/docs/.vitepress/components).

## Next steps

- [React Integration](./react-integration)
- [Event System](../guide/events)
