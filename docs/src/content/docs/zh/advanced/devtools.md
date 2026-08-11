---
title: "DevTools 扩展"
---


AFSM 提供一个 Chrome 开发者工具扩展，可在浏览器面板里实时观察运行中的状态机。

## 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/langhuihui/afsm.git
   ```
2. 打开 Chrome 扩展管理页 `chrome://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择仓库中的 `devtools/dist` 目录

## 使用

1. 打开任意使用了 AFSM 的页面
2. 打开开发者工具（F12）
3. 切换到「智能自动机」标签页
4. 左侧树显示所有 FSM 实例（按 `groupName` 分组）
5. 选中一个实例：
   - 右侧显示 mermaid 状态图（当前状态用 🚩 标记）
   - 下方时间线显示状态变更历史

## 工作原理

扩展通过 content-script 注入 `window.__AFSM__ = true`：

```js
// content-script.js
inject(`window.__AFSM__ = true`)
```

AFSM 库在模块加载时检测 `window.__AFSM__`：

```ts
const sendDevTools = (() => {
  const hasDevTools = typeof window !== 'undefined' && window['__AFSM__']
  return hasDevTools ? (name, detail) => {
    window.dispatchEvent(new CustomEvent(name, { detail }))
  } : () => {}
})()
```

每次 `setState` 调用 `sendDevTools(FSM.UPDATEAFSM, { name, group, value, old, err })`，派发 `updateAFSM` CustomEvent。content-script 监听并转发给扩展面板。

## 在 Playground 中观察

本站点的 Playground 运行的是真实 AFSM 库。如果你安装了扩展并打开本页面：

1. 开发者工具 → 智能自动机标签
2. 在 Playground 点「运行」
3. 扩展面板会显示对应的状态机实例与变更历史

:::tip
这是 AFSM 的「自举」演示——文档站本身就是 AFSM 应用的实例。
:::

## 功能

### 时间线对比

勾选多个 FSM 实例，右侧切换为数据表格，按时间对齐显示各状态机的状态变化。

### 复制 / 粘贴 / 下载

- 复制到剪贴板：把历史 JSON 复制出来
- 从剪贴板读取：粘贴历史 JSON 回放
- 下载：保存为文件

## 限制

- 扩展使用 Manifest V2
- mermaid 版本较旧（9.x），与库的 `stateDiagram` 输出兼容
- content-script 在 `document_start` 注入，确保 `window.__AFSM__` 在 AFSM 模块加载前就绪

## 下一步

- [Playground 工作原理](./playground) — 本站点 Playground 的实现
- [可视化状态图](../guide/visualization) — mermaid 输出格式
