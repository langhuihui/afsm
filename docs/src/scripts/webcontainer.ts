import { WebContainer } from '@webcontainer/api';

let wc: WebContainer | null = null;
let booting: Promise<WebContainer> | null = null;

/**
 * Get the singleton WebContainer instance. HMR-safe: reuses the existing
 * instance across module reloads. `boot()` can only be called once per page.
 */
export async function getWebContainer(): Promise<WebContainer> {
  if (wc) return wc;
  if (booting) return booting;
  booting = WebContainer.boot().then((instance) => {
    wc = instance;
    return instance;
  });
  return booting;
}

/** Check if the current browser supports WebContainer. */
export function isWebContainerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof SharedArrayBuffer !== 'undefined' &&
    typeof Atomics !== 'undefined' &&
    // WebContainer requires cross-origin isolation
    typeof crossOriginIsolated !== 'undefined' &&
    crossOriginIsolated
  );
}
