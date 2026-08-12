# AFSM DevTools

Chrome/Edge Manifest V3 extension for inspecting running AFSM instances.

State diagrams use the shared `afsm-diagram` package (Cytoscape), same as the docs Playground.

## Install

```bash
cd devtools
pnpm install --ignore-workspace   # first time: pnpm approve-builds esbuild
pnpm build
```

Then Chrome → `chrome://extensions/` → Developer mode → Load unpacked → `devtools/dist`.

## Usage

Open DevTools on any page that uses AFSM, then switch to the **AFSM** / **智能自动机** panel.
