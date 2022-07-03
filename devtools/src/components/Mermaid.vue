
<script setup lang="ts">
import { useDialog } from 'naive-ui';
import { h, ref, watchEffect } from 'vue';
//@ts-ignore
import mermaid from 'mermaid';
const props = defineProps({
  value: {
    default: {} as FSMInfo,
  },
});
const dialog = useDialog();
const divRef = ref();
watchEffect(() => {
  if (divRef.value)
    mermaid.mermaidAPI.render('mermaid', ['stateDiagram-v2', ...props.value.diagram].join('\n'), function (svgCode: string) {
      divRef.value.innerHTML = svgCode;
    });
});
function showDiagram() {
  dialog.info({
    title: props.value.name,
    content: () => h('div', {
      class: 'mermaid',
      id: props.value.name,
      ref: divRef,
    }, [['stateDiagram-v2', ...props.value.diagram].join('\n')]),
  });
}</script>
<template>
  <n-button @click="showDiagram">{{ value.state }}</n-button>
</template>