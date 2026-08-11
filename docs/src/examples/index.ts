// Side-effect import: triggers all preset registrations.
// Kept separate from registry.ts to avoid a circular import
// (registry exports `registerExample` which presets need; this module
// imports the registry first to fully initialize the `examples` map,
// then globs the presets).
import './registry';
const modules = import.meta.glob('./presets/*.ts', { eager: true });
void modules;

export * from './registry';
