
function inject(source) {
  if (document instanceof HTMLDocument) {
    if (typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Firefox') > -1) {
      // eslint-disable-next-line no-eval
      window.eval(source); // in Firefox, this evaluates on the content window
    } else {
      const script = document.createElement('script');
      script.textContent = source;
      document.documentElement.appendChild(script);
      script.parentNode.removeChild(script);
    }
  }
}
inject(`window.__AFSM__ = true`);
const port = chrome.runtime.connect({
  name: 'content-script'
});
window.addEventListener('updateAFSM', msg => {
  port.postMessage(msg.detail);
});