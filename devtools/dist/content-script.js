let port;

function connect() {
  try {
    port = chrome.runtime.connect({ name: 'content-script' });
    port.onMessage.addListener((msg) => {
      if (msg && msg.type === 'dump') {
        window.dispatchEvent(new CustomEvent('__AFSM_DUMP__'));
      }
    });
    port.onDisconnect.addListener(() => {
      port = null;
      setTimeout(connect, 1000);
    });
  } catch {
    setTimeout(connect, 1000);
  }
}

window.addEventListener('updateAFSM', (msg) => {
  try {
    port?.postMessage(msg.detail);
  } catch {
    // panel/background may have gone away mid-send
  }
});

connect();
