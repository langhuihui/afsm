<script setup lang="ts">
/// <reference types="chrome" />
import { computed, h, onMounted, reactive, ref, watchEffect } from 'vue';
import { format } from 'date-fns';
//@ts-ignore
import mermaid from 'mermaid';
import SuffixVue from './components/Suffix.vue';
import { DataTableColumn, TreeOption } from 'naive-ui';
const fsms: { [key: string]: FSMInfo; } = {};
const group: { [key: string]: TreeOption; } = reactive({});
const fsmGroup = reactive([] as TreeOption[]);
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
function getInfoUniqueName(info: { name: string, group: string; }) {
  return `${info.group}®️${info.name}`;
}
const connected = ref(false);
const allHistory: { key: string, state: FSMStateInfo; }[] = [];//总体历史
const reconnect = () => {
  try {
    const port = chrome.runtime.connect({
      name: "" + chrome.devtools.inspectedWindow.tabId,
    });
    console.log("Connected to background", port);
    port.onMessage.addListener((data: '🎟️' | FrontMessage | NoteMessage | CreateMessage | ChangeMessage) => {
      if (data == '🎟️') {
        console.log("content connected", port);
        connected.value = true;
        clearAll();
      } else if ('diagram' in data) {
        const initState = { time: Date.now(), state: "[*]", action: "", processing: false, note: "" };
        if (!group[data.group]) {
          group[data.group] = { key: data.group, label: data.group, children: [] };
          fsmGroup.push(group[data.group]);
        };
        const newInfo = reactive({
          ...data,
          key: getInfoUniqueName(data),
          state: initState,
          history: [initState],
        });
        allHistory.push({ key: newInfo.key, state: initState });
        group[data.group].children?.push({ key: newInfo.key, label: data.name, isLeaf: true });
        fsms[newInfo.key] = newInfo;
        if (!currentFSM.value) currentFSM.value = newInfo;
      } else if ('note' in data) {
        const infoKey = getInfoUniqueName(data);
        if (fsms[infoKey]) fsms[infoKey].state.note = data.note;
      } else if ('value' in data) {
        const infoKey = getInfoUniqueName(data);
        if (fsms[infoKey]) {
          const info = fsms[infoKey];
          let success = typeof data.old == 'string' || data.old.oldState != data.value;
          const action = typeof data.old != 'string' ? data.old.action + (success ? '🟢' : '🔴') : typeof data.value != 'string' ? data.value.action : "";
          info.state = { note: "", time: Date.now(), processing: typeof data.value != 'string', state: typeof data.value == 'string' ? data.value : data.value.action + 'ing', err: data.err, action };
          info.history.push(info.state);
          allHistory.push({ key: infoKey, state: info.state });
        }
      } else {
        const infoKey = getInfoUniqueName(data);
        if (fsms[infoKey]) {
          const children = group[data.group].children!;
          const index = children.findIndex(x => x.key == infoKey);
          if (index >= 0) {
            children.splice(index, 1);
          }
          if (children.length == 0) {
            fsmGroup.splice(fsmGroup.findIndex(x => x.key == data.group), 1);
            delete group[data.group];
          }
        }
      }
    });
    port.onDisconnect.addListener(() => {
      console.log("disconnect");
      connected.value = false;
      setTimeout(reconnect, 1000);
    });
  } catch (err) {
    setTimeout(reconnect, 1000);
  }
};
function clearAll() {
  fsmGroup.length = 0;
  for (const key in group) {
    delete group[key];
  }
  for (const key in fsms) {
    delete fsms[key];
  }
  allHistory.length = 0;
  checked.value.length = 0;
  currentFSM.value = null;
}
reconnect();
const currentFSM = ref(null as FSMInfo | null);
const divRef = ref();
const checked = ref([] as FSMInfo[]);
// const timeline = computed(() => {
//   const keys = checked.value.filter(key => fsms[key]);
//   const result = keys.map(key => [] as Array<FSMStateInfo | number>);
//   let i = 0;
//   let next = i;
//   for (let h of allHistory) {
//     for (let j = 0; j < result.length; j++) {
//       if (h.key == keys[j]) {
//         result[j][i] = h.state;
//         next = i + 1;
//       } else {
//         result[j][i] = h.state.time;
//       }
//     }
//     i = next;
//   }
//   return result;
// });
const columns = ref([] as DataTableColumn[]);
const data = computed(() => {
  let i = 0;
  let next = i;
  const result: any[] = [];
  const infos = checked.value;
  for (let history of allHistory) {
    const maybe = { time: format(history.state.time, 'hh:mm:ss.SSS') } as any;
    for (let j = 0; j < infos.length; j++) {
      if (history.key == infos[j].key) {
        maybe[infos[j].key] = history.state.state;
        next = i + 1;
        result[i] = maybe;
      }
    }
    i = next;
  }
  return result;
});
function updateCheckedKeys(keys: string[]) {
  checkedKeys.value = keys;
  checked.value = keys.filter(key => fsms[key]).map(key => fsms[key]);
  columns.value = checked.value.map(info => {
    return {
      title: () => h('div', [info.group, h('br'), info.name]), key: info.key
    };
  });
  columns.value.unshift({ title: "Time", key: "time", width: 130 });
}
watchEffect(() => {
  if (divRef.value && currentFSM.value && currentFSM.value.diagram.length)
    mermaid.mermaidAPI.render('mermaid', ['stateDiagram-v2', ...currentFSM.value.diagram, `note left of ${currentFSM.value.state.state} : 🚩`].join('\n'), function (svgCode: string) {
      divRef.value.innerHTML = svgCode;
    });
});
const Mermaid = function () {
  return h('div', {
    class: 'mermaid',
    id: currentFSM.value!.name,
    ref: divRef,
  });
};
function renderSuffix({ option }: { option: TreeOption; }) {
  return fsms[option.key!] ? h(
    SuffixVue,
    { state: fsms[option.key!].state },
  ) : h("");
}
function onSelected(keys: string[]) {
  currentFSM.value = fsms[keys[0]];
  updateCheckedKeys(keys);
}
const checkedKeys = ref([] as string[]);
async function copy() {
  //@ts-ignore
  navigator.permissions.query({ name: 'clipboard-write' }).then(permissionStatus => {
    if (permissionStatus.state == 'granted') {
      navigator.clipboard.writeText(JSON.stringify(allHistory));
    } else {
      alert("You must grant clipboard permission to copy data");
    }
  });
}
async function paste() {
  //@ts-ignore
  const permissionStatus = await navigator.permissions.query({ name: 'clipboard-read' });
  if (permissionStatus.state == 'granted') {
    const text = await navigator.clipboard.readText();
    clearAll();
    const data = JSON.parse(text);
    for (const d of data) {
      const [_group, name] = d.key.split('®️');
      if (!group[_group]) {
        group[_group] = { key: _group, label: _group, children: [] };
        fsmGroup.push(group[_group]);
      };
      allHistory.push(d);
      group[data.group].children?.push({ key: d.key, label: name, isLeaf: true });
      if (!fsms[d.key]) fsms[d.key] = { group: _group, name, key: d.key, state: d.state, history: [d.state], diagram: [] };
      else fsms[d.key].history.push(d.state);
    }
  } else {
    alert("You must grant clipboard permission to paste data");
  }
}
</script>

<template>
  <n-layout style="height: 100vh">
    <n-layout-header>
      <n-space class="title-bar">
        <n-avatar size="small" src="./logo.png">
        </n-avatar>
        <span class="title">智能状态机可视化界面</span>
        <n-tag round :bordered="false" :type="connected ? 'success' : 'error'">
          {{ connected ? "已连接" : "未连接" }}
        </n-tag>
        <n-button size="small" @click="clearAll">清空</n-button>
        <n-button size="small" @click="copy">复制到剪贴板</n-button>
        <n-button size="small" @click="paste">从剪贴板读取</n-button>
      </n-space>
    </n-layout-header>
    <n-layout has-sider>
      <n-layout-sider content-style="padding: 24px;">
        <n-tree cascade checkable block-line :data="fsmGroup" :render-suffix="renderSuffix" :checked-keys="checkedKeys"
          @update:selected-keys="onSelected" @update:checked-keys="updateCheckedKeys" default-expand-all />
      </n-layout-sider>
      <n-layout-content content-style="padding: 24px;">
        <n-data-table single-column :single-line="false" :data="data" :columns="columns" v-if="checked.length > 1">
        </n-data-table>
        <n-space v-else>
          <n-timeline v-if="currentFSM">
            <n-timeline-item v-for="state in currentFSM.history" :content="state.note" :title="state.state"
              :time="format(state.time, 'hh:mm:ss.SSS')"
              :type="state.action ? state.processing ? 'info' : (state.err ? 'error' : 'success') : 'default'" />
          </n-timeline>
          <Mermaid v-if='currentFSM' />
        </n-space>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style>
.n-card {
  max-width: 300px;
}

.title-bar {
  padding: 10px;
  background-color: rgb(204, 204, 204);
}

.title {
  font-size: 20px;
}

.current>rect {
  fill: #FF0000;
  stroke: #FFFF00;
  stroke-width: 4px;
}
</style>
