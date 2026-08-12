<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createDiagram, syncDiagram, type DiagramTheme } from 'afsm-diagram';

const props = defineProps<{
  diagram: string[];
  currentState: string;
  theme?: DiagramTheme;
}>();

const containerRef = ref<HTMLElement>();
const sourceRef = { current: '' };
let cy: ReturnType<typeof createDiagram> | null = null;

onMounted(() => {
  if (!containerRef.value || !props.diagram.length) return;
  cy = createDiagram(containerRef.value, props.theme ?? 'dark');
  syncDiagram(cy, props.diagram, props.currentState, sourceRef);
});

onBeforeUnmount(() => {
  cy?.destroy();
  cy = null;
  sourceRef.current = '';
});

watch(
  () => [props.diagram, props.currentState, props.theme] as const,
  () => {
    if (!containerRef.value) return;
    if (!cy && props.diagram.length) {
      cy = createDiagram(containerRef.value, props.theme ?? 'dark');
      sourceRef.current = '';
    }
    if (!cy) return;
    if (!props.diagram.length) {
      cy.destroy();
      cy = null;
      sourceRef.current = '';
      return;
    }
    syncDiagram(cy, props.diagram, props.currentState, sourceRef);
  },
  { flush: 'post' },
);
</script>

<template>
  <div ref="containerRef" class="diagram" />
</template>

<style scoped>
.diagram {
  width: 420px;
  height: 460px;
  min-width: 320px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 6px;
}
</style>
