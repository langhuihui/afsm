<script setup lang="ts">
/// <reference types="chrome" />
import { computed, h, onMounted, reactive, ref, watchEffect } from 'vue';
import { format } from 'date-fns';
//@ts-ignore
import mermaid from 'mermaid';
import { pluckValueFromRange } from 'naive-ui/es/date-picker/src/utils';
const fsms = reactive({} as { [key: string]: FSMInfo; });
type MiddleState = { oldState: string; newState: string; action: string; };
const reconnect = () => {
  try {
    const port = chrome.runtime.connect({
      name: "" + chrome.devtools.inspectedWindow.tabId,
    });
    console.log("Connected to background", port);
    port.onMessage.addListener((data: { name: string, diagram: string[]; } | '🎟️' | { name: string, value: string | MiddleState, old: string | MiddleState; }) => {
      if (data == '🎟️') {
        console.log("content connected", port);
        clearAll();
      } else if ('diagram' in data) {
        const initState = { time: Date.now(), state: "[*]", success: true, action: "" };
        fsms[data.name] = {
          name: data.name,
          diagram: data.diagram,
          state: initState,
          history: [initState],
        };
        if (!showName.value) showName.value = data.name;
      } else {
        let success = typeof data.old == 'string' || data.old.oldState != data.value;
        const action = typeof data.old != 'string' ? data.old.action + (success ? '🟢' : '🔴') : typeof data.value != 'string' ? data.value.action : "";
        fsms[data.name].state = { time: Date.now(), state: typeof data.value == 'string' ? data.value : data.value.action + 'ing', success, action };
        fsms[data.name].history.push(fsms[data.name].state);
      }
    });
    port.onDisconnect.addListener(() => {
      console.log("disconnect");
      setTimeout(reconnect, 1000);
    });
  } catch (err) {
    setTimeout(reconnect, 1000);
  }
};
function clearAll() {
  for (const key in fsms) {
    delete fsms[key];
  }
  showName.value = "";
}
reconnect();
const showName = ref("");
const currentFSM = computed(() => fsms[showName.value]);
const divRef = ref();
watchEffect(() => {
  if (divRef.value && currentFSM.value)
    mermaid.mermaidAPI.render('mermaid', ['stateDiagram-v2', ...currentFSM.value.diagram].join('\n'), function (svgCode: string) {
      divRef.value.innerHTML = svgCode;
    });
});
const Mermaid = function () {
  return showName.value ? h('div', {
    class: 'mermaid',
    id: showName.value,
    ref: divRef,
  }) : "";
};
</script>

<template>
  <n-layout style="height: 100vh">
    <n-layout-header>
      <n-tabs type="card" v-model:value="showName">
        <n-tab :name="item.name" v-for="item in fsms">
          <n-space vertical>
            {{ item.name }}
            <n-tag size="small" :type="item.state.success ? 'success' : 'error'" :bordered="false">
              {{ item.state.state }}
            </n-tag>
          </n-space>
        </n-tab>
      </n-tabs>
    </n-layout-header>
    <n-layout has-sider position="absolute" style="top: 64px; bottom: 64px">
      <n-layout-sider content-style="padding: 24px;">
        <n-timeline v-if="currentFSM">
          <n-timeline-item :content="state.action" :title="state.state" v-for="state in currentFSM.history"
            :time="format(state.time, 'hh:mm:ss.SSS')"
            :type="state.action ? (/ing$/.test(state.state)) ? 'info' : (state.success ? 'success' : 'error') : 'default'" />
        </n-timeline>
      </n-layout-sider>
      <n-layout-content content-style="padding: 24px;">
        <Mermaid />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style>
.n-card {
  max-width: 300px;
}

.current>rect {
  fill: #FF0000;
  stroke: #FFFF00;
  stroke-width: 4px;
}
</style>