---
title: "Playground 工作原理"
description: "本站 Playground 如何运行 AFSM 示例：编辑、执行与状态图联动原理。"
---


本站点的 Playground 是一个可交互的 AFSM 示例运行器。

## 架构

```
Playground.vue
  ├── ParamControl.vue     参数控件
  ├── CodeBlock.vue        源码显示（只读）
  ├── MermaidView.vue      状态图渲染
  ├── Timeline.vue         状态变更时间线
  └── ConsoleOut.vue       控制台输出
```

所有组件位于 [`docs/.vitepress/components/`](https://github.com/langhuihui/afsm/tree/main/docs/.vitepress/components)。

## 运行真实库

Playground 直接 `import { FSM, ChangeState } from 'afsm'`，通过 `file:..` 链接父包。运行的是真实的 AFSM 库，不是简化版。

## 示例注册表

每个示例在 `docs/.vitepress/examples/presets/` 下定义，通过 `registerExample` 注册：

```ts
import { FSM, ChangeState } from 'afsm'
import { registerExample } from '../registry'
import source from './trafficLight.ts?raw'   // 源码字符串

class TrafficLight extends FSM {
  @ChangeState(FSM.INIT, 'red')
  async init() {}
  // ...
}

registerExample({
  key: 'traffic-light',
  source,                    // 显示在 CodeBlock
  params: [...],             // 参数 schema
  create(params) {           // 实例化 FSM
    return new TrafficLight()
  },
  run(fsm, params, log) {    // 启动演示
    fsm.init()
  },
  cleanup(fsm) {              // 清理定时器
    // ...
  },
  title: { zh: '红绿灯', en: 'Traffic Light' },
  description: { ... }
})
```

## 源码显示与运行一致

用 Vite 的 `?raw` 后缀导入源码字符串：

```ts
import source from './trafficLight.ts?raw'
```

这样 `CodeBlock` 显示的源码与实际运行的代码**完全一致**——单一来源，不会脱节。

## 事件流

```ts
function run() {
  const inst = example.create(params)
  inst.on(FSM.STATECHANGED, (newState, oldState, err) => {
    // 推入 Timeline
    // 更新 currentState
    // 触发 MermaidView 重渲染
  })
  example.run(inst, params, log)
}
```

`log` 函数由 Playground 注入，把输出收集到 `ConsoleOut` 面板（不替换全局 `console`）。

## 状态图渲染

`StateDiagramView` 使用共享包 `afsm-diagram`（Cytoscape）渲染 AFSM `stateDiagram` 边线：

```ts
import { createDiagram, syncDiagram } from 'afsm-diagram'
const cy = createDiagram(container, 'docs')
syncDiagram(cy, diagram, currentState, sourceKey)
```

当前状态通过 `.current` / `.processing` 节点类高亮（不再使用 mermaid note）。DevTools 面板使用同一套渲染器。

## 清理

切换示例或点「重置」时：

1. `fsm.removeAllListeners()` — 移除所有监听
2. `example.cleanup(fsm)` — 清理定时器等资源
3. 清空 `history`、`consoleLog`、`currentState`

## 贡献新示例

1. 在 `docs/.vitepress/examples/presets/` 新建 `myExample.ts`
2. 定义 FSM 类（用 `@ChangeState` 等装饰器）
3. 调用 `registerExample({...})`
4. 用 `?raw` 导入自身源码作为 `source`
5. 示例会自动出现在 Playground 下拉框

## 限制

- 不能自由编辑代码（安全考虑，避免任意执行）
- 示例避免使用 `opt.context`（`FSM.get` 会在静态 Map 缓存，跨 reset 可能残留）
- 源码必须是自包含的（不能依赖外部模块，除 `afsm` 外）

## 下一步

- [DevTools 扩展](./devtools) — 在 Playground 中实时观察
- [GitHub 源码](https://github.com/langhuihui/afsm/tree/main/docs/.vitepress)
