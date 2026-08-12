<script setup lang="ts">
/// <reference types="chrome" />
import { computed, h, reactive, ref } from 'vue';
import { format } from 'date-fns';
import { darkTheme, type DataTableColumn, type TreeOption } from 'naive-ui';
import SuffixVue from './components/Suffix.vue';
import StateDiagramView from './components/StateDiagramView.vue';

const HISTORY_LIMIT = 2000;
const FSM_HISTORY_LIMIT = 500;
const zh = (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage?.() || navigator.language).startsWith('zh');
const t = {
  title: zh ? '智能状态机可视化' : 'AFSM Inspector',
  connected: zh ? '已连接' : 'Connected',
  disconnected: zh ? '未连接' : 'Disconnected',
  clear: zh ? '清空' : 'Clear',
  copy: zh ? '复制' : 'Copy',
  paste: zh ? '粘贴' : 'Paste',
  download: zh ? '下载' : 'Download',
  copyFailed: zh ? '复制失败' : 'Copy failed',
  pasteFailed: zh ? '粘贴失败，数据格式无效' : 'Paste failed: invalid data',
  time: 'Time',
};
const isDark = typeof chrome !== 'undefined' && chrome.devtools?.panels?.themeName === 'dark';

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
const allHistory: { key: string, state: FSMStateInfo; }[] = [];
const reconnect = () => {
  try {
    const port = chrome.runtime.connect({
      name: '' + chrome.devtools.inspectedWindow.tabId,
    });
    port.onMessage.addListener((data: '🎟️' | FrontMessage | NoteMessage | CreateMessage | ChangeMessage) => {
      if (data == '🎟️') {
        connected.value = true;
        clearAll();
      } else if ('diagram' in data) {
        const key = getInfoUniqueName(data);
        if (fsms[key]) {
          fsms[key].diagram = data.diagram;
          return;
        }
        const initState = { time: Date.now(), state: '[*]', action: '', processing: false, note: '' };
        if (!group[data.group]) {
          group[data.group] = { key: data.group, label: data.group, children: [] };
          fsmGroup.push(group[data.group]);
        }
        const newInfo = reactive({
          ...data,
          key,
          state: initState,
          history: [initState],
        });
        pushAllHistory({ key, state: initState });
        group[data.group].children?.push({ key, label: data.name, isLeaf: true });
        fsms[key] = newInfo;
        if (!currentFSM.value) currentFSM.value = newInfo;
      } else if ('note' in data) {
        const infoKey = getInfoUniqueName(data);
        if (fsms[infoKey]) fsms[infoKey].state.note = data.note;
      } else if ('value' in data) {
        const infoKey = getInfoUniqueName(data);
        if (fsms[infoKey]) {
          const info = fsms[infoKey];
          let success = typeof data.old == 'string' || data.old.oldState != data.value;
          const action = typeof data.old != 'string' ? data.old.action + (success ? '🟢' : '🔴') : typeof data.value != 'string' ? data.value.action : '';
          info.state = { note: '', time: Date.now(), processing: typeof data.value != 'string', state: typeof data.value == 'string' ? data.value : data.value.action + 'ing', err: data.err, action };
          pushFsmHistory(info, info.state);
          pushAllHistory({ key: infoKey, state: info.state });
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
          delete fsms[infoKey];
        }
      }
    });
    port.onDisconnect.addListener(() => {
      connected.value = false;
      setTimeout(reconnect, 1000);
    });
  } catch {
    setTimeout(reconnect, 1000);
  }
};
function pushAllHistory(entry: { key: string, state: FSMStateInfo; }) {
  allHistory.push(entry);
  if (allHistory.length > HISTORY_LIMIT) {
    allHistory.splice(0, allHistory.length - HISTORY_LIMIT);
  }
}
function pushFsmHistory(info: FSMInfo, state: FSMStateInfo) {
  info.history.push(state);
  if (info.history.length > FSM_HISTORY_LIMIT) {
    info.history.splice(0, info.history.length - FSM_HISTORY_LIMIT);
  }
}
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
  checkedKeys.value = [];
  currentFSM.value = null;
}
reconnect();
const currentFSM = ref(null as FSMInfo | null);
const checked = ref([] as FSMInfo[]);
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
  columns.value.unshift({ title: t.time, key: 'time', width: 130 });
}
function renderSuffix({ option }: { option: TreeOption; }) {
  return fsms[option.key!] ? h(
    SuffixVue,
    { state: fsms[option.key!].state },
  ) : h('');
}
function onSelected(keys: string[]) {
  currentFSM.value = fsms[keys[0]];
  updateCheckedKeys(keys);
}
const checkedKeys = ref([] as string[]);
async function copy() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(allHistory));
  } catch {
    alert(t.copyFailed);
  }
}
async function paste() {
  try {
    const text = await navigator.clipboard.readText();
    const parsed = JSON.parse(text) as { key: string, state: FSMStateInfo; }[];
    if (!Array.isArray(parsed)) throw new Error('invalid');
    clearAll();
    for (const d of parsed) {
      if (!d?.key || !d.state) continue;
      const [_group, name] = d.key.split('®️');
      if (!_group || !name) continue;
      if (!group[_group]) {
        group[_group] = { key: _group, label: _group, children: [] };
        fsmGroup.push(group[_group]);
      }
      pushAllHistory(d);
      if (!fsms[d.key]) {
        group[_group].children?.push({ key: d.key, label: name, isLeaf: true });
        fsms[d.key] = { group: _group, name, key: d.key, state: d.state, history: [d.state], diagram: [] };
      } else {
        pushFsmHistory(fsms[d.key], d.state);
        fsms[d.key].state = d.state;
      }
    }
  } catch {
    alert(t.pasteFailed);
  }
}
function download() {
  const blob = new Blob([JSON.stringify(allHistory)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `afsm-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <n-config-provider :theme="isDark ? darkTheme : undefined">
    <n-layout style="height: 100vh">
      <n-layout-header>
        <n-space class="title-bar" align="center">
          <n-avatar size="small" src="./logo.png">
          </n-avatar>
          <span class="title">{{ t.title }}</span>
          <n-tag round :bordered="false" :type="connected ? 'success' : 'error'">
            {{ connected ? t.connected : t.disconnected }}
          </n-tag>
          <n-button size="small" @click="clearAll">{{ t.clear }}</n-button>
          <n-button size="small" @click="copy">{{ t.copy }}</n-button>
          <n-button size="small" @click="paste">{{ t.paste }}</n-button>
          <n-button size="small" @click="download">{{ t.download }}</n-button>
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
            <StateDiagramView
              v-if="currentFSM"
              :diagram="currentFSM.diagram"
              :current-state="currentFSM.state.state"
              :theme="isDark ? 'dark' : 'light'"
            />
          </n-space>
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<style>
html,
body,
#app {
  margin: 0;
  height: 100%;
}

.title-bar {
  padding: 10px;
}

.title {
  font-size: 20px;
}
</style>
