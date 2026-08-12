---
title: "DevTools Extension"
description: "Install the AFSM Chrome/Edge DevTools extension to inspect live state machines, diagrams, and history."
---


AFSM ships a **Manifest V3** Chrome / Edge DevTools extension. On any page that uses AFSM, open the panel to see the FSM instance tree, a Cytoscape state diagram, and a state-change timeline.

## Quick install (recommended)

The repo includes a built `dist` — you usually **do not** need to compile first:

1. Get the source (either):
   ```bash
   git clone https://github.com/langhuihui/afsm.git
   cd afsm
   ```
   Or download a ZIP from [GitHub](https://github.com/langhuihui/afsm) and unpack it.
2. Open the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Turn on **Developer mode**
4. Click **Load unpacked**
5. Select the **`devtools/dist`** folder in the repo (not the `devtools` root)
6. Confirm **AFSM** (v2.x) appears in the list

**Reload** any already-open app tabs (or this site’s Playground) after installing so `window.__AFSM__` is injected.

:::tip
The extension is not on the Chrome Web Store — always load unpacked from this repo’s `devtools/dist`. After pulling updates, click **Reload** on the extension card and refresh the target page.
:::

## Rebuild from source

If `dist` is missing/outdated, or you changed the extension:

```bash
cd afsm/devtools
pnpm install --ignore-workspace
# First time, if esbuild scripts are blocked:
pnpm approve-builds esbuild --ignore-workspace
pnpm build
```

Then load **`devtools/dist`** again (or **Reload** the existing unpacked extension).

## Usage

### 1. Open the panel

1. Open any page that imports `afsm` (or this site’s [Playground](/en/playground))
2. Press <kbd>F12</kbd> (or right-click → Inspect)
3. Find the **AFSM** tab (Chinese UI may show **智能自动机**)
4. Check the header status:
   - **Connected** — content script ↔ panel is up
   - **Disconnected** — refresh the page, or ensure the extension is enabled for that origin

:::note
The panel lives in the **DevTools tab bar**, not as a browser toolbar icon. If you don’t see it, open the `»` overflow menu in the DevTools header.
:::

### 2. Panel layout

| Area | Purpose |
| --- | --- |
| Left tree | FSM instances grouped by `groupName`; suffix shows current state |
| Right (single select) | Cytoscape diagram (current / `…ing` highlighted) + timeline |
| Right (multi-check) | Time-aligned comparison table across instances |
| Header actions | Clear / Copy / Paste / Download history JSON |

Instance `name` and optional `groupName` come from the FSM constructor — see [FSM](/en/api/fsm).

### 3. Verify with this site’s Playground

The Playground runs the real AFSM library — a good smoke test after install:

1. Install and enable the extension
2. Open the [Playground](/en/playground)
3. Refresh → <kbd>F12</kbd> → **AFSM** tab
4. Click **Run** in the Playground
5. You should see the FSM on the left; diagram + timeline update on the right

:::tip
This is AFSM’s “bootstrapped” demo — the docs site itself is an AFSM app.
:::

### 4. Inspect your own app

If the page loads `afsm` and the extension injected `window.__AFSM__` at `document_start`, **no app code changes** are required — `setState` reports to the panel automatically.

Tips:

- `http://localhost:…` works (the extension has `<all_urls>` host permission)
- Opening the panel late still works — a snapshot restores each instance’s **current** diagram + state
- Use readable `name` / `groupName` so the tree stays scannable

## Features

### Timeline comparison

**Check** multiple instances in the tree to switch the right pane to a time-aligned table.

### Copy / Paste / Download

- **Copy** — history JSON to the clipboard  
- **Paste** — replay history JSON (diagram may be empty if not included)  
- **Download** — save as `afsm-*.json`

### Clear

Clears the panel tree/history selection only — it does **not** destroy in-page FSMs.

## Troubleshooting

| Symptom | What to try |
| --- | --- |
| No **AFSM** tab | Confirm you loaded `devtools/dist`; extension enabled; reopen DevTools; check the overflow menu |
| Stuck **Disconnected** | Refresh the page; no site restriction on the extension; check the extension error page |
| Empty tree | Is AFSM actually constructed on the page? Reload so injection happens **before** the library loads |
| Late-open panel has no full history | Expected — snapshot is current state only; timeline starts after connect |
| Weird after upgrade | Extension **Reload** → hard-refresh the page; or remove and load `dist` again |
| Edge / other Chromium | Supported — use that browser’s extensions page |

## How it works (short)

1. A MAIN-world content script sets `window.__AFSM__ = true` at `document_start`
2. AFSM checks that flag on every update and dispatches `updateAFSM`
3. An isolated-world content script forwards events to the panel
4. On connect, the panel requests a dump; the page handles `__AFSM_DUMP__` and replays the last diagram + state per instance

## Limitations

- Manifest V3; load unpacked from `devtools/dist` (not the Web Store)
- Late-open snapshot does not include history from before the panel opened
- History is capped to keep long-running pages from blowing up the panel

## Next steps

- [Visualizing the Diagram](/en/guide/visualization) — `stateDiagram` text format
- [Playground](/en/playground) — run examples next to the extension
- [Playground Internals](./playground-internals) — how the docs site renders the same graphs
