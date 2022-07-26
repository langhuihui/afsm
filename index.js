import EventEmitter from 'eventemitter3';
const instance = Symbol('instance');
// 中间过渡状态
export class MiddleState {
    oldState;
    newState;
    action;
    error;
    constructor(oldState, newState, action) {
        this.oldState = oldState;
        this.newState = newState;
        this.action = action;
    }
    toString() {
        return `${this.action}ing`;
    }
}
export class FSMError extends Error {
    state;
    message;
    cause;
    constructor(state, message, cause) {
        super(message);
        this.state = state;
        this.message = message;
        this.cause = cause;
    }
}
const stateDiagram = new Map();
export function ChangeState(from, to) {
    return (target, propertyKey, descriptor) => {
        const action = propertyKey;
        if (!stateDiagram.has(target)) {
            stateDiagram.set(target, []);
            Object.defineProperty(target, 'stateDiagram', {
                configurable: true,
                get() {
                    let result = new Set();
                    let plain = [];
                    let forceTo = [];
                    const stateConfig = stateDiagram.get(target);
                    const allState = new Set();
                    Object.defineProperty(target, 'allStates', { value: allState });
                    const parent = Object.getPrototypeOf(target);
                    if (stateDiagram.has(parent)) {
                        parent.stateDiagram.forEach((stateDesc) => result.add(stateDesc));
                        parent.allStates.forEach((state) => allState.add(state));
                    }
                    stateConfig.forEach(({ from, to, action }) => {
                        if (typeof from === 'string') {
                            plain.push({ from, to, action });
                        }
                        else {
                            if (from.length) {
                                from.forEach(f => {
                                    plain.push({ from: f, to, action });
                                });
                            }
                            else
                                forceTo.push({ to, action });
                        }
                    });
                    plain.forEach(({ from, to, action }) => {
                        allState.add(from);
                        allState.add(to);
                        allState.add(action + "ing");
                        result.add(`${from} --> ${action}ing : ${action}`);
                        result.add(`${action}ing --> ${to} : ${action} 🟢`);
                        result.add(`${action}ing --> ${from} : ${action} 🔴`);
                    });
                    forceTo.forEach(({ to, action }) => {
                        result.add(`${action}ing --> ${to} : ${action} 🟢`);
                        allState.forEach(f => {
                            if (f !== to)
                                result.add(`${f} --> ${action}ing : ${action}`);
                        });
                    });
                    const value = [...result];
                    Object.defineProperty(target, 'stateDiagram', { value });
                    return value;
                }
            });
        }
        stateDiagram.get(target).push({ from, to, action });
        const origin = descriptor.value;
        descriptor.value = async function (...arg) {
            // if (typeof this.state != "string") throw new Error(`${this.name} ${action} to ${to} faild: last action ${this.state.action} to ${this.state.newState} not complete`);
            if (this.state === to)
                return this._cacheResult;
            if (Array.isArray(from)) {
                if (from.length == 0) {
                    if (this.abortCtrl)
                        this.abortCtrl.aborted = true;
                }
                else if ((typeof this.state != "string" || !from.includes(this.state)))
                    throw new FSMError(this._state, `${this.name} ${action} to ${to} faild: current state ${this._state} not in from config`);
            }
            else {
                if (from !== this.state)
                    throw new FSMError(this._state, `${this.name} ${action} to ${to} faild: current state ${this._state} not from ${from}`);
            }
            const old = this.state;
            setState.call(this, new MiddleState(old, to, action));
            const abort = { aborted: false };
            this.abortCtrl = abort;
            try {
                this._cacheResult = await origin.apply(this, arg);
                if (abort.aborted) {
                    return this._cacheResult;
                }
                else {
                    this.abortCtrl = void 0;
                }
                setState.call(this, to);
                return this._cacheResult;
            }
            catch (err) {
                setState.call(this, old, String(err));
                throw new FSMError(this._state, `action '${action}' failed`, err instanceof Error ? err : new Error(String(err)));
            }
        };
    };
}
//包含状态，即只在此种状态下方可调用函数
export function Includes(...states) {
    return (target, propertyKey, descriptor) => {
        const origin = descriptor.value;
        const action = propertyKey;
        descriptor.value = function (...arg) {
            if (!states.includes(this.state.toString()))
                throw new FSMError(this.state, `${this.name} ${action} faild: current state ${this.state} not in ${states}`);
            return origin.apply(this, arg);
        };
    };
}
//排除状态，即不在此种状态下方可调用函数
export function Excludes(...states) {
    return (target, propertyKey, descriptor) => {
        const origin = descriptor.value;
        const action = propertyKey;
        descriptor.value = async function (...arg) {
            if (states.includes(this.state.toString()))
                throw new FSMError(this.state, `${this.name} ${action} faild: current state ${this.state} in ${states}`);
            return origin.apply(this, arg);
        };
    };
}
const sendDevTools = (() => {
    //@ts-ignore
    const hasDevTools = typeof window !== 'undefined' && window['__AFSM__'];
    const inWorker = typeof importScripts !== 'undefined';
    return hasDevTools ? (name, detail) => {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    } : inWorker ? (type, payload) => {
        postMessage({ type, payload });
    } : () => { };
})();
function setState(value, err) {
    const old = this._state;
    this._state = value;
    const state = value.toString();
    if (value)
        this.emit(state, old);
    this.emit(FSM.STATECHANGED, value, old, err);
    this.updateDevTools({ value, old, err });
}
export class FSM extends EventEmitter {
    name;
    groupName;
    get stateDiagram() {
        return [];
    }
    static STATECHANGED = 'stateChanged';
    static UPDATEAFSM = 'updateAFSM';
    static INIT = "[*]"; //初始状态
    static ON = "on";
    static OFF = "off";
    _state = FSM.INIT;
    _cacheResult;
    abortCtrl;
    constructor(name, groupName) {
        super();
        this.name = name;
        this.groupName = groupName;
        if (!name)
            name = Date.now().toString(36);
        const prototype = Object.getPrototypeOf(this);
        if (!groupName)
            this.groupName = this.constructor.name;
        const names = prototype[instance];
        if (!names)
            prototype[instance] = { name: this.name, count: 0 };
        else
            this.name = names.name + "-" + names.count++;
        this.updateDevTools({ diagram: this.stateDiagram });
    }
    updateDevTools(payload = {}) {
        sendDevTools(FSM.UPDATEAFSM, { name: this.name, group: this.groupName, ...payload });
    }
    get state() {
        return this._state;
    }
}
//# sourceMappingURL=index.js.map