/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_STACKBLITZ_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    isPlaygroundRoute?: boolean;
  }
}

// Allow importing ?raw suffixed modules
declare module '*?raw' {
  const content: string;
  export default content;
}

// Worker module type
declare module '*?worker' {
  const workerConstructor: new () => Worker;
  export default workerConstructor;
}

