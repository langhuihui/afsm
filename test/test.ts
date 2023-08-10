import { FSM, ChangeState } from '../index.js';
class Connection extends FSM {
  @ChangeState(FSM.INIT, "connected")
  connect() {
    return new Promise((resolve, reject) => {
      setTimeout(Math.random() > 0.2 ? resolve : reject, 1000);
    });
  }
  @ChangeState("disconnected", "reconnected")
  reconnect() {
    return new Promise((resolve, reject) => {
      setTimeout(Math.random() > 0.8 ? resolve : reject, 1000);
    });
  }
  @ChangeState([], "disconnected")
  disconnect() {
    this.reconnectAfter(1000);
  }
  @ChangeState([FSM.INIT, "stop"], "started", { context: "stuff" })
  start() {
  }
  @ChangeState("started", "stop", { context: "stuff", abortAction: "start" })
  stop() {

  }
  reconnectAfter(delay: number) {
    setTimeout(() => this.reconnect().then(() => console.log("reconnect success")).catch(() => this.reconnectAfter(delay)), delay);
  }
}
const conn = new Connection();
console.log(conn.stateDiagram.join('\n'));
conn.on(FSM.STATECHANGED, (newState) => {
  console.log(newState.toString());
});
conn.connect().then(() => {
  setTimeout(() => conn.disconnect(), 1000);
}, () => {
  console.log("connect failed");
});
