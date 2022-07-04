import EventEmitter from 'eventemitter3';
// 中间过渡状态
export class MiddleState {
    oldState;
    newState;
    action;
    constructor(oldState, newState, action) {
        this.oldState = oldState;
        this.newState = newState;
        this.action = action;
    }
    toString() {
        return `${this.action}ing`;
    }
}
const stateDiagram = new Map();
export function ChangeState(from, to) {
    return (target, propertyKey, descriptor) => {
        if (!stateDiagram.has(target)) {
            stateDiagram.set(target, []);
            Object.defineProperty(target, 'stateDiagram', {
                get() {
                    let result = [];
                    let plain = [];
                    let forceTo = [];
                    const stateConfig = stateDiagram.get(target);
                    const allState = new Set();
                    stateConfig.forEach(({ from, to, action }) => {
                        allState.add(to);
                        if (typeof from === 'string') {
                            allState.add(from);
                            plain.push({ from, to, action });
                            allState.add(action + "ing");
                        }
                        else {
                            if (from.length) {
                                from.forEach(f => {
                                    allState.add(f);
                                    plain.push({ from: f, to, action });
                                });
                                allState.add(action + "ing");
                            }
                            else
                                forceTo.push({ to, action });
                        }
                    });
                    plain.forEach(({ from, to, action }) => {
                        result.push(`${from} --> ${action}ing : ${action}`, `${action}ing --> ${to} : ${action} 🟢`, `${action}ing --> ${from} : ${action} 🔴`);
                    });
                    forceTo.forEach(({ to, action }) => {
                        result.push(`${action}ing --> ${to} : ${action} 🟢`);
                        allState.forEach(f => {
                            if (f !== to)
                                result.push(`${f} --> ${action}ing : ${action}`);
                        });
                    });
                    return result;
                }
            });
        }
        stateDiagram.get(target).push({ from, to, action: propertyKey.toString() });
        const origin = descriptor.value;
        descriptor.value = async function (...arg) {
            if (this.state === to || typeof this.state != "string")
                throw FSM.ESTATE;
            if (Array.isArray(from)) {
                if (from.length == 0) {
                    if (this.abortCtrl)
                        this.abortCtrl.aborted = true;
                }
                else if ((!from.includes(this.state)))
                    throw FSM.ESTATE;
            }
            else {
                if (from !== this.state)
                    throw FSM.ESTATE;
            }
            const old = this.state;
            this.state = new MiddleState(old, to, propertyKey);
            const abort = { aborted: false };
            this.abortCtrl = abort;
            try {
                const result = await origin.apply(this, arg);
                if (abort.aborted) {
                    throw FSM.EABORT;
                }
                else {
                    this.abortCtrl = void 0;
                }
                this.state = to;
                return result;
            }
            catch (err) {
                this.state = old;
                throw err;
            }
        };
    };
}
//@ts-ignore
const hasDevTools = typeof window !== 'undefined' && window['__AFSM__'];
const inWorker = typeof importScripts !== 'undefined';
export class FSM extends EventEmitter {
    name;
    static STATECHANGED = 'stateChanged';
    static EABORT = new Error('abort');
    static ESTATE = new Error('wrong state');
    static INIT = "[*]";
    static ON = "on";
    static OFF = "off";
    get stateDiagram() {
        return [];
    }
    _state = FSM.INIT;
    abortCtrl;
    constructor(name) {
        super();
        this.name = name;
        this.name = this.name || this.constructor.name;
        if (hasDevTools)
            window.dispatchEvent(new CustomEvent("createAFSM", { detail: { name: this.name, diagram: this.stateDiagram } }));
        else if (inWorker)
            postMessage({ type: 'createAFSM', payload: { name: this.name, diagram: this.stateDiagram } });
    }
    get state() {
        return this._state;
    }
    set state(value) {
        const old = this._state;
        this._state = value;
        const state = value.toString();
        if (value)
            this.emit(state, old);
        this.emit(FSM.STATECHANGED, value, old);
        if (hasDevTools)
            window.dispatchEvent(new CustomEvent("changeAFSM", { detail: { name: this.name, value, old } }));
        else if (inWorker)
            postMessage({ type: 'changeAFSM', payload: { name: this.name, value, old } });
    }
}
