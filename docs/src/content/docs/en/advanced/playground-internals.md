---
title: "Playground Internals"
---


The Playground on this site is an interactive AFSM example runner.

## Architecture

```
Playground.vue
  ├── ParamControl.vue     parameter controls
  ├── CodeBlock.vue        source display (read-only)
  ├── MermaidView.vue      state diagram rendering
  ├── Timeline.vue         state-change timeline
  └── ConsoleOut.vue       console output
```

All components live in [`docs/.vitepress/components/`](https://github.com/langhuihui/afsm/tree/main/docs/.vitepress/components).

## Running the real library

The Playground directly `import { FSM, ChangeState } from 'afsm'` via a `file:..` link to the parent package. It runs the real AFSM library, not a simplified version.

## Example registry

Each example is defined under `docs/.vitepress/examples/presets/` and registered via `registerExample`:

```ts
import { FSM, ChangeState } from 'afsm'
import { registerExample } from '../registry'
import source from './trafficLight.ts?raw'   // source as string

class TrafficLight extends FSM {
  @ChangeState(FSM.INIT, 'red')
  async init() {}
  // ...
}

registerExample({
  key: 'traffic-light',
  source,                    // shown in CodeBlock
  params: [...],             // parameter schema
  create(params) {           // instantiate the FSM
    return new TrafficLight()
  },
  run(fsm, params, log) {    // kick off the demo
    fsm.init()
  },
  cleanup(fsm) {              // clear timers
    // ...
  },
  title: { zh: '红绿灯', en: 'Traffic Light' },
  description: { ... }
})
```

## Source display matches running code

The Vite `?raw` suffix imports the source as a string:

```ts
import source from './trafficLight.ts?raw'
```

So the `CodeBlock` shows **exactly** the code that runs — single source of truth, never out of sync.

## Event flow

```ts
function run() {
  const inst = example.create(params)
  inst.on(FSM.STATECHANGED, (newState, oldState, err) => {
    // push to Timeline
    // update currentState
    // trigger MermaidView re-render
  })
  example.run(inst, params, log)
}
```

`log` is injected by the Playground and routes output to the `ConsoleOut` panel (without replacing the global `console`).

## Mermaid rendering

`MermaidView.vue` dynamically imports mermaid and initializes/renders inside `onMounted`:

```ts
const mermaid = (await import('mermaid')).default
await mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })
const { svg } = await mermaid.render(id, source)
containerRef.value.innerHTML = svg
```

The current state is marked via a mermaid `note left of <state> : 🚩` line (only added when the state is a real node in the diagram).

## Cleanup

On example switch or "Reset":

1. `fsm.removeAllListeners()` — remove all listeners
2. `example.cleanup(fsm)` — clear timers and other resources
3. Clear `history`, `consoleLog`, `currentState`

## Contributing a new example

1. Create `docs/.vitepress/examples/presets/myExample.ts`
2. Define an FSM class (using `@ChangeState` and other decorators)
3. Call `registerExample({...})`
4. Import your own source via `?raw` as `source`
5. The example auto-appears in the Playground dropdown

## Limitations

- No free-form code editing (security: avoid arbitrary execution)
- Examples avoid `opt.context` (`FSM.get` caches in a static Map, which could leak across resets)
- Source must be self-contained (no external module deps besides `afsm`)

## Next steps

- [DevTools Extension](./devtools) — observe the Playground live
- [GitHub source](https://github.com/langhuihui/afsm/tree/main/docs/.vitepress)
