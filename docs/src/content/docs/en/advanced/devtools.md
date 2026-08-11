---
title: "DevTools Extension"
---


AFSM ships with a Chrome DevTools extension to inspect running state machines live.

## Install

1. Clone the repo:
   ```bash
   git clone https://github.com/langhuihui/afsm.git
   ```
2. Open Chrome's extension management page `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `devtools/dist` directory in the repo

## Usage

1. Open any page that uses AFSM
2. Open DevTools (F12)
3. Switch to the "智能自动机" (Smart Automaton) tab
4. The left tree lists all FSM instances (grouped by `groupName`)
5. Select an instance:
   - The right shows a mermaid state diagram (current state marked with 🚩)
   - Below: a timeline of state-change history

## How it works

The extension's content-script injects `window.__AFSM__ = true`:

```js
// content-script.js
inject(`window.__AFSM__ = true`)
```

The AFSM library checks `window.__AFSM__` at module load:

```ts
const sendDevTools = (() => {
  const hasDevTools = typeof window !== 'undefined' && window['__AFSM__']
  return hasDevTools ? (name, detail) => {
    window.dispatchEvent(new CustomEvent(name, { detail }))
  } : () => {}
})()
```

Every `setState` call invokes `sendDevTools(FSM.UPDATEAFSM, { name, group, value, old, err })`, dispatching an `updateAFSM` CustomEvent. The content-script listens and forwards to the extension panel.

## Observing the Playground

The Playground on this site runs the real AFSM library. If you have the extension installed and open this page:

1. DevTools → Smart Automaton tab
2. Click "Run" in the Playground
3. The panel shows the corresponding state machine instance and change history

:::tip
This is AFSM's "bootstrapped" demo — the docs site itself is an AFSM application instance.
:::

## Features

### Timeline comparison

Check multiple FSM instances; the right side switches to a data table, aligning state changes by time.

### Copy / Paste / Download

- Copy to clipboard: copies the history JSON
- Paste from clipboard: replays history JSON
- Download: saves as a file

## Limitations

- Uses Manifest V2
- Uses an older mermaid (9.x), compatible with the library's `stateDiagram` output
- Content-script injects at `document_start` so `window.__AFSM__` is ready before AFSM loads

## Next steps

- [Playground Internals](./playground) — how this site's Playground is built
- [Visualizing the Diagram](../guide/visualization) — mermaid output format
