---
title: "Vue 集成"
description: "在 Vue 3 中用 reactive 或 ref 订阅 AFSM 状态，驱动响应式 UI。"
---


在 Vue 3 中使用 AFSM，推荐用 `reactive` 包装或 `ref` 订阅状态。

## 基本用法

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

## 组合式函数

封装一个 `useFSM`：

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

使用：

```vue
<script setup lang="ts">
const state = useFSMState(counter)
</script>
<template>
  <p>{{ state }}</p>
</template>
```

## 中间态与 UI

```vue
<template>
  <button :disabled="state === 'logining'" @click="auth.login(token)">
    {{ state === 'logining' ? 'Logging in...' : 'Login' }}
  </button>
</template>
```

## Pinia 集成

AFSM 可以与 Pinia 共存——FSM 管理状态机，Pinia 管理全局 store：

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

## 本站点的 Playground 就是 Vue

本站点的 Playground 组件就是用 Vue 3 + AFSM 实现：

```vue
<!-- 简化版 -->
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

完整源码见 [GitHub](https://github.com/langhuihui/afsm/tree/main/docs/.vitepress/components)。

## 下一步

- [React 集成](./react-integration)
- [事件系统](../guide/events)
