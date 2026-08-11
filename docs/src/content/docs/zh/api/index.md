---
title: "API 参考"
---


AFSM 的公开 API 全部从 `afsm` 包导出。

## 导出清单

```ts
import {
  FSM,                  // 基类
  ChangeState,          // 状态迁移装饰器
  tryChangeState,      // 见说明（实际为 no-op）
  Includes,             // 状态守卫：包含
  Excludes,             // 状态守卫：排除
  ActionState,          // 动作态装饰器
  MiddleState,          // 中间态类
  FSMError,             // 错误类
  // 类型
  type State,
  type IFSM,
  type ChangeOption
} from 'afsm'
```

## 章节导航

- [FSM 类](./fsm) — 基类、静态常量、实例属性
- [@ChangeState](./change-state) — 装饰器签名与 `ChangeOption`
- [@ActionState](./action-state) — 动作态装饰器
- [@Includes / @Excludes](./includes-excludes) — 状态守卫
- [MiddleState](./middle-state) — 中间态类
- [FSMError](./fsm-error) — 错误类
- [tryChangeState](./try-change-state) — 注意事项
- [类型定义](./types) — `State`、`IFSM`、`ChangeOption`

## 快速速查

### 常量

| 常量 | 值 | 说明 |
| --- | --- | --- |
| `FSM.STATECHANGED` | `'stateChanged'` | 状态变化事件名 |
| `FSM.UPDATEAFSM` | `'updateAFSM'` | DevTools 更新事件名 |
| `FSM.INIT` | `'[*]'` | 初始状态 |
| `FSM.ON` | `'on'` | 通用「开」状态 |
| `FSM.OFF` | `'off'` | 通用「关」状态 |

### 静态方法

| 方法 | 说明 |
| --- | --- |
| `FSM.get(context)` | 获取与 context 关联的 FSM（组合模式） |
| `FSM.getState(context)` | 直接获取某 context 的状态 |
