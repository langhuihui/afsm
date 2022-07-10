# 智能状态机

- 目的：更加自动和简洁的实现状态的迁移。
- 原理：通过装饰器，对异步函数进行包装，使得调用异步函数可以自动修改状态，并且自动实现异步调用过程中的中间状态。

👉[演示视频](https://www.bilibili.com/video/BV1kv4y1T7v4/)

# 安装 
  
  ```bash
  npm install afsm
  ```
# 使用

```ts

import { FSM, ChangeState } from 'afsm'

class MyFSM extends FSM {
  @ChangeState(FSM.INIT,'state1')
  async gotoState1() {

  }
  @ChangeState('state1','state2')
  async gotoState2() {

  }
}
const obj =  new MyFSM()
obj.gotoState2()//will throw error
obj.gotoState1().then(()=>{//will change to state1
  return obj.gotoState2()//then change to state2
})

```
## 事件

其他对象如果希望得知状态机的变化，可以通过监听事件实现。

每一种状态变更时，都会发出事件，如果是中间过渡状态则会自动加ing。
```ts
const obj =  new MyFSM()
obj.on('gotoState2ing',(oldState) => {
  console.log(obj,'is going to state2')
})
obj.on('state2',(oldState) => {
  console.log(obj,'is state2 now')
})

```
此外为了方便监听所有事件，还会同时发出changeStated事件。异步调用的成功与失败都会导致状态变更，可以通过下面的监听来判断。
```ts
const obj =  new MyFSM()
obj.on(FSM.STATECHANGED,(newState:State, oldState:State) => {
 
})

```
其中State的定义参考下面的源码中的定义
```ts
export type State = string | MiddleState;
// 中间过渡状态
export class MiddleState {
  constructor(public oldState: State, public newState: string, public action: string) {
  }
  toString() {
    return `${this.action}ing`;
  }
}

```

# 使用浏览器扩展可视化状态机

afsm浏览器扩展可以在开发人员工具的标签页中生成一个可视化页面，供实时观察代码运行的情况。

## 使用方法
1.将仓库 clone 下来后，打开浏览器扩展管理，点击加载解压缩的扩展，选择仓库中的 devtools/dist 目录。
2.打开一个页面，并打开控制台，选择智能状态机标签，即可看到扩展页面。
3.当项目中使用了AFSM后，会自动向扩展页面发送信息，扩展页面可以看到项目中的状态机图以及状态机的变更记录。
