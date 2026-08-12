const zh = (chrome.i18n.getUILanguage() || '').startsWith('zh');
chrome.devtools.panels.create(
  zh ? '智能自动机' : 'AFSM',
  '/logo.png',
  '/index.html'
);
