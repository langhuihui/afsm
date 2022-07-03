import { createApp } from 'vue';
import App from './App.vue';
//@ts-ignore
import mermaid from 'mermaid';
mermaid.mermaidAPI.initialize({ startOnLoad: false });
createApp(App).mount('#app');
