<template>
  <n-popover trigger="hover" v-if="state.err">
    <template #trigger>
      <n-button type="error" quaternary size="tiny"> {{ state.state }}</n-button>
    </template>
    <span>{{ state.err }}</span>
  </n-popover>
  <n-spin size="small" v-else-if="state.processing" :description="state.state">
  </n-spin>
  <n-tag size="small" type="success" :bordered="false" v-else>
    {{ state.state }}
  </n-tag>
</template>
<script lang="ts" setup>
defineProps<{ state: FSMStateInfo; }>();
</script>