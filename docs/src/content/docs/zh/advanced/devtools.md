---
title: "DevTools 扩展"
description: "安装 AFSM Chrome/Edge DevTools 扩展，实时观察页面中的状态机、状态图与变更历史。"
---


AFSM 提供 **Manifest V3** Chrome / Edge 开发者工具扩展。打开任意使用了 AFSM 的页面，即可在 DevTools 面板里看到 FSM 实例树、Cytoscape 状态图与状态变更时间线。

## 快速安装（推荐）

仓库已包含构建产物，一般**不用先编译**：

1. 获取源码（任选其一）：
   ```bash
   git clone https://github.com/langhuihui/afsm.git
   cd afsm
   ```
   或从 [GitHub](https://github.com/langhuihui/afsm) 下载 ZIP 并解压。
2. 浏览器打开扩展管理页：
   - Chrome：`chrome://extensions/`
   - Edge：`edge://extensions/`
3. 打开右上角 **「开发者模式」**
4. 点击 **「加载已解压的扩展程序」** / **Load unpacked**
5. 选择仓库里的 **`devtools/dist`** 目录（不要选 `devtools` 根目录）
6. 确认列表里出现扩展 **AFSM**（版本 2.x）

安装后**刷新**已打开的业务页（或本站 Playground），再开 DevTools，才能注入 `window.__AFSM__`。

:::tip
扩展不会上架 Chrome 应用商店；请始终从本仓库的 `devtools/dist` 加载。升级代码后若面板异常，在扩展页点「重新加载」，并刷新目标页面。
:::

## 从源码重新构建

若 `dist` 缺失、过旧，或你改过扩展源码：

```bash
cd afsm/devtools
pnpm install --ignore-workspace
# 首次若提示忽略 esbuild 脚本：
pnpm approve-builds esbuild --ignore-workspace
pnpm build
```

构建完成后，仍加载 **`devtools/dist`**。已加载过的扩展在扩展管理页点「重新加载」即可。

## 使用

### 1. 打开面板

1. 打开任意使用了 `afsm` 的页面（或本站 [Playground](/zh/playground)）
2. 按 <kbd>F12</kbd>（或右键 → 检查）打开开发者工具
3. 在顶部标签中找到 **「AFSM」**（中文环境也可能显示为 **「智能自动机」**）
4. 看标题栏连接状态：
   - **已连接**：content script 已与面板打通
   - **未连接**：刷新页面，或确认扩展已对本源启用

:::note
面板出现在 **DevTools 顶栏**，不是浏览器工具栏图标。若看不到标签，点 DevTools 顶栏的 `»` 溢出菜单查找。
:::

### 2. 面板布局

| 区域 | 作用 |
| --- | --- |
| 左侧树 | 按 `groupName` 分组列出 FSM 实例；叶子节点旁显示当前状态 |
| 右侧（单选） | Cytoscape 状态图（当前态 / `…ing` 过渡态高亮）+ 时间线 |
| 右侧（多选勾选） | 多个实例时切换为按时间对齐的对比表 |
| 顶栏按钮 | 清空 / 复制 / 粘贴 / 下载历史 JSON |

实例名来自构造函数的 `name`，分组默认是 `constructor.name`，也可传入 `groupName`。详见 [FSM 类](/zh/api/fsm)。

### 3. 用本站 Playground 验证

本站 Playground 跑的是真实 AFSM 库，适合先确认扩展是否装好：

1. 安装并启用扩展
2. 打开 [Playground](/zh/playground)（或本页下方嵌入示例所在文档）
3. 刷新页面 → <kbd>F12</kbd> → **AFSM** 标签
4. 在 Playground 点「运行」
5. 左侧应出现对应 FSM；右侧图与时间线应随状态更新

:::tip
这是 AFSM 的「自举」演示——文档站本身就是 AFSM 应用实例。
:::

### 4. 在你自己的项目里观察

只要页面加载了 `afsm`，且扩展在 `document_start` 注入了 `window.__AFSM__`，**无需改业务代码**：库会在 `setState` 时自动向扩展发事件。

建议：

- 本地开发用 `http://localhost:…` 即可（扩展有 `<all_urls>` 主机权限）
- 先打开页面再开面板，或晚开面板也可以——扩展会请求快照，恢复各实例**当前** diagram + 状态
- 给重要 FSM 起可读的 `name` / `groupName`，方便在树里辨认

## 功能说明

### 时间线对比

在左侧树**勾选**多个实例，右侧改为数据表，按时间对齐各机状态。

### 复制 / 粘贴 / 下载

- **复制**：把面板内累计历史打成 JSON 写入剪贴板  
- **粘贴**：用 JSON 回放历史（用于复盘；不含完整 diagram 时图可能为空）  
- **下载**：保存为 `afsm-*.json`

### 清空

清空面板内树、历史与选中项；**不会**销毁页面里的真实 FSM。

## 常见问题

| 现象 | 处理 |
| --- | --- |
| 没有「AFSM」标签 | 确认加载的是 `devtools/dist`；扩展已启用；关掉 DevTools 再开；看溢出菜单 |
| 一直「未连接」 | 刷新目标页；扩展管理页对该站点无限制；看扩展是否报错 |
| 树是空的 | 页面是否真的 `import`/`new` 了 AFSM？扩展是否在库加载**前**注入（刷新一次） |
| 晚开面板没有完整历史 | 预期行为：快照只恢复当前态；完整时间线从面板连接后开始记 |
| 升级后行为怪异 | 扩展页「重新加载」→ 硬刷新页面；必要时删掉扩展再加载 `dist` |
| Edge / Chromium | 同样支持；用对应的 `edge://extensions/` 等管理页 |

## 工作原理（简要）

1. MAIN 世界 content script 在 `document_start` 设置 `window.__AFSM__ = true`
2. AFSM 每次更新检查该标志，派发 `updateAFSM` CustomEvent
3. 隔离世界 content script 转发到扩展面板
4. 面板连上后发送 dump 请求；页面用 `__AFSM_DUMP__` 重放各实例最近一次 diagram + 状态

## 限制

- 需 Manifest V3，从 `devtools/dist` **加载已解压**扩展（非应用商店）
- 晚打开面板时的快照不含打开前的完整历史
- 历史条数有上限（避免长跑页面撑爆面板）

## 下一步

- [可视化状态图](/zh/guide/visualization) — `stateDiagram` 文本格式
- [Playground](/zh/playground) — 在线跑示例并对照扩展
- [Playground 工作原理](./playground-internals) — 文档站如何渲染同一套图
