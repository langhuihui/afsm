/**
This script is run whenever the devtools are open.
In here, we can create our panel.
*/

// function handleShown() {
//   // chrome.devtools.inspectedWindow.eval("console.log('超级日志 handleShown')")
// }

// function handleHidden() {
//   // chrome.devtools.inspectedWindow.eval("console.log('超级日志 handleHidden')")
// }

/**
Create a panel, and add listeners for panel show/hide events.
*/
chrome.devtools.panels.create(
  "智能自动机",
  "/logo.png",
  "/index.html"
  , (newPanel) => {
    // newPanel.onShown.addListener(handleShown);
    // newPanel.onHidden.addListener(handleHidden);
  });
