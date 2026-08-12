const ports = {};

function slot(tabId) {
  if (!ports[tabId]) ports[tabId] = { panel: null, content: null };
  return ports[tabId];
}

function requestDump(content) {
  try {
    content.postMessage({ type: 'dump' });
  } catch {
    // content port already gone
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (isNumeric(port.name)) {
    const tabId = +port.name;
    const s = slot(tabId);
    s.panel = port;
    port.onDisconnect.addListener(() => {
      if (s.panel === port) s.panel = null;
    });
    if (s.content) {
      port.postMessage('🎟️');
      requestDump(s.content);
    }
  } else {
    const tabId = port.sender?.tab?.id;
    if (tabId == null) return;
    const s = slot(tabId);
    s.content = port;
    port.onMessage.addListener((message) => {
      try {
        s.panel?.postMessage(message);
      } catch {
        // panel closed
      }
    });
    port.onDisconnect.addListener(() => {
      if (s.content === port) s.content = null;
    });
    if (s.panel) {
      s.panel.postMessage('🎟️');
      requestDump(port);
    }
  }
});

function isNumeric(str) {
  return +str + '' === str;
}
