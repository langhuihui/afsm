
/**
When we receive the message, execute the given script in the given
tab.
*/
// function handleMessage(request, sender, sendResponse) {

//   if (sender.url != chrome.runtime.getURL("/devtools/panel/panel.html")) {
//     return;
//   }

//   chrome.tabs.executeScript(
//     request.tabId, 
//     {
//       code: request.script
//     });

// }

// /**
// Listen for messages from our devtools panel.
// */
// chrome.runtime.onMessage.addListener(handleMessage); 
const ports = {};
chrome.runtime.onConnect.addListener(port => {
  let tabId;
  if (isNumeric(port.name)) {
    tabId = +port.name;
    if (!ports[tabId]) ports[tabId] = [];
    ports[tabId][0] = port;
    console.log('devtool-page connected ' + tabId, port.sender);
    port.onMessage.addListener(msg => {
      ports[tabId][1].postMessage(msg);
    });
    if(ports[tabId][1]){
      port.postMessage('🎟️');
    }
  } else {
    tabId = port.sender.tab.id;
    if (!ports[tabId]) ports[tabId] = [];
    ports[tabId][1] = port;
    console.log('frontend connected ' + tabId);
    port.onMessage.addListener((message) => {
      if (ports[tabId][0]) {
        console.log('backend -> devtools', message);
        ports[tabId][0].postMessage(message);
      }
    });
    port.onDisconnect.addListener(() => {
      ports[tabId][1] = null;
      console.log('frontend disconnected ' + tabId);
    });
    if (ports[tabId][0]) {
      ports[tabId][0].postMessage('🎟️');
    }
    // chrome.tabs.executeScript(tabId, {
    //   file: 'inject.js',
    // }, () => {
    //   console.log('inject success ' + tabId);
    // });
  }
});

function isNumeric(str) {
  return +str + '' === str;
}
