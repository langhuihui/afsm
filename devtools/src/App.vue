<script setup lang="ts">
/// <reference types="chrome" />
import { computed, h, onMounted, reactive, ref, watchEffect } from 'vue';
import { format } from 'date-fns';
//@ts-ignore
import mermaid from 'mermaid';
import SuffixVue from './components/Suffix.vue';
const group: { [key: string]: { children: { [key: string]: FSMInfo; }, group: FSMInfoGroup; }; } = {};
const fsmGroup = reactive([] as FSMInfoGroup[]);
type MiddleState = { oldState: string; newState: string; action: string; };
interface FrontMessage {
  name: string;
  group: string;
}
interface NoteMessage extends FrontMessage {
  note: string;
}
interface CreateMessage extends FrontMessage {
  diagram: string[];
}
interface ChangeMessage extends FrontMessage {
  value: string | MiddleState, old: string | MiddleState, err?: string;
}
const reconnect = () => {
  try {
    const port = chrome.runtime.connect({
      name: "" + chrome.devtools.inspectedWindow.tabId,
    });
    console.log("Connected to background", port);
    port.onMessage.addListener((data: '🎟️' | FrontMessage | NoteMessage | CreateMessage | ChangeMessage) => {
      if (data == '🎟️') {
        console.log("content connected", port);
        clearAll();
      } else if ('diagram' in data) {
        const initState = { time: Date.now(), state: "[*]", action: "", processing: false, note: "" };
        if (!group[data.group]) {
          group[data.group] = { children: {}, group: { name: data.group, children: [] } };
          fsmGroup.push(group[data.group].group);
        }
        group[data.group].children[data.name] = {
          ...data,
          state: initState,
          history: [initState],
        };
        group[data.group].group.children.push(group[data.group].children[data.name]);
        if (!currentFSM.value) currentFSM.value = group[data.group].children[data.name];
      } else if ('note' in data) {
        if (group[data.group] && group[data.group].children[data.name]) group[data.group].children[data.name].state.note = data.note;
      } else if ('value' in data) {
        if (group[data.group] && group[data.group].children[data.name]) {
          const info = group[data.group].children[data.name];
          let success = typeof data.old == 'string' || data.old.oldState != data.value;
          const action = typeof data.old != 'string' ? data.old.action + (success ? '🟢' : '🔴') : typeof data.value != 'string' ? data.value.action : "";
          info.state = { note: "", time: Date.now(), processing: typeof data.value != 'string', state: typeof data.value == 'string' ? data.value : data.value.action + 'ing', err: data.err, action };
          info.history.push(info.state);
        }
      } else {
        if (group[data.group] && group[data.group].children[data.name]) {
          group[data.group].group.children.splice(group[data.group].group.children.indexOf(group[data.group].children[data.name]), 1);
          delete group[data.group].children[data.name];
          if(group[data.group].group.children.length == 0) {
            fsmGroup.splice(fsmGroup.indexOf(group[data.group].group), 1);
            delete group[data.group];
          }
        }
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
  for (const key in fsmGroup) {
    delete fsmGroup[key];
  }
  for (const key in group) {
    delete group[key];
  }
  currentFSM.value = null;
}
reconnect();
const currentFSM = ref(null as FSMInfo | null);
const divRef = ref();
watchEffect(() => {
  if (divRef.value && currentFSM.value)
    mermaid.mermaidAPI.render('mermaid', ['stateDiagram-v2', ...currentFSM.value.diagram, `note left of ${currentFSM.value.state.state} : 🚩`].join('\n'), function (svgCode: string) {
      divRef.value.innerHTML = svgCode;
    });
});
const Mermaid = function () {
  return currentFSM.value ? h('div', {
    class: 'mermaid',
    id: currentFSM.value.name,
    ref: divRef,
  }) : "";
};
function renderSuffix({ option }: { option: FSMInfo; }) {
  return h(
    SuffixVue,
    { state: option.state },
  );
}
</script>

<template>
  <n-layout style="height: 100vh">
    <n-layout-header>
      <!-- <n-tabs type="card" v-model:value="showName">
        <n-tab :name="item.name" v-for="item in fsms">
          <n-space vertical>
            {{ item.name }}
            <n-popover trigger="hover" v-if="item.state.err">
              <template #trigger>
                <n-button> {{ item.state.state }}</n-button>
              </template>
              <span>item.state.err</span>
            </n-popover>
            <n-spin size="small" v-else-if="item.state.processing" />
            <n-tag size="small" type="success" :bordered="false" v-else>
              {{ item.state.state }}
            </n-tag>
          </n-space>
        </n-tab>
      </n-tabs> -->
    </n-layout-header>
    <n-layout has-sider position="absolute" style="top: 64px; bottom: 64px">
      <n-layout-sider content-style="padding: 24px;">
        <n-tree block-line :data="fsmGroup" key-field="name" label-field="name" :render-suffix="renderSuffix" />
      </n-layout-sider>
      <n-layout-content content-style="padding: 24px;">
        <n-space>
          <n-timeline v-if="currentFSM">
            <n-timeline-item :content="state.note" :title="state.state" v-for="state in currentFSM.history"
              :time="format(state.time, 'hh:mm:ss.SSS')"
              :type="state.action ? state.processing ? 'info' : (state.err ? 'error' : 'success') : 'default'" />
          </n-timeline>
          <Mermaid />
        </n-space>
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
