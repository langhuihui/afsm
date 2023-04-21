import EventEmitter from 'eventemitter3';
const instance = Symbol('instance');
const abortCtrl = Symbol('abortCtrl');
const cacheResult = Symbol('cacheResult');
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
const originPromise = Object.getPrototypeOf((async () => { })()).constructor;
export function ChangeState(from, to, opt = {}) {
    return (target, propertyKey, descriptor) => {
        const action = opt.action || propertyKey;
        if (!opt.context) {
            const stateConfig = stateDiagram.get(target) || [];
            if (!stateDiagram.has(target))
                stateDiagram.set(target, stateConfig);
            stateConfig.push({ from, to, action });
        }
        const origin = descriptor.value;
        descriptor.value = async function (...arg) {
            let fsm = this;
            if (opt.context) {
                // @ts-ignore
                fsm = FSM.get(typeof opt.context === 'function' ? opt.context.call(this, ...arg) : opt.context);
            }
            if (fsm.state === to)
                return fsm[cacheResult];
            let err = null;
            if (Array.isArray(from)) {
                if (from.length == 0) {
                    if (fsm[abortCtrl])
                        fsm[abortCtrl].aborted = true;
                }
                else if ((typeof fsm.state != "string" || !from.includes(fsm.state))) {
                    err = new FSMError(fsm._state, `${fsm.name} ${action} to ${to} failed: current state ${fsm._state} not in from config`);
                }
            }
            else {
                if (from !== fsm.state) {
                    err = new FSMError(fsm._state, `${fsm.name} ${action} to ${to} failed: current state ${fsm._state} not from ${from}`);
                }
            }
            if (err) {
                if (opt.fail)
                    opt.fail.call(this, err);
                else if (opt.ignoreError)
                    return err;
                else
                    throw err;
            }
            const old = fsm.state;
            setState.call(fsm, new MiddleState(old, to, action));
            const abort = { aborted: false };
            fsm[abortCtrl] = abort;
            try {
                const result = origin.apply(this, arg);
                if (result instanceof originPromise)
                    fsm[cacheResult] = await result;
                else
                    fsm[cacheResult] = result;
                if (abort.aborted)
                    return fsm[cacheResult];
                else
                    fsm[abortCtrl] = void 0;
                setState.call(fsm, to);
                opt.success?.call(this, fsm[cacheResult]);
                return fsm[cacheResult];
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setState.call(fsm, old, msg);
                if (opt.fail)
                    opt.fail.call(this, new FSMError(fsm._state, `action '${action}' failed :${msg}`, err instanceof Error ? err : new Error(msg)));
                else if (opt.ignoreError)
                    return err;
                else
                    throw err;
            }
        };
    };
}
export function tryChangeState(from, to, opt = { ignoreError: true }) {
    ChangeState(from, to, opt);
}
//包含状态，即只在此种状态下方可调用函数
export function Includes(...states) {
    return (target, propertyKey, descriptor) => {
        const origin = descriptor.value;
        const action = propertyKey;
        descriptor.value = function (...arg) {
            if (!states.includes(this.state.toString()))
                throw new FSMError(this.state, `${this.name} ${action} failed: current state ${this.state} not in ${states}`);
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
                throw new FSMError(this.state, `${this.name} ${action} failed: current state ${this.state} in ${states}`);
            return origin.apply(this, arg);
        };
    };
}
//动作状态，即异步函数执行期间，状态为actioning,或者自定义名称，结束后回到原状态
export function ActionState(name) {
    return (target, propertyKey, descriptor) => {
        const origin = descriptor.value;
        const action = name || propertyKey;
        descriptor.value = async function (...arg) {
            const old = this.state;
            setState.call(this, action);
            try {
                let result = origin.apply(this, arg);
                if (result instanceof originPromise)
                    result = await result;
                setState.call(this, old);
                return result;
            }
            catch (err) {
                setState.call(this, old, err instanceof Error ? err.message : String(err));
                throw err;
            }
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
class FSM extends EventEmitter {
    name;
    groupName;
    get stateDiagram() {
        const protoType = Object.getPrototypeOf(this);
        const stateConfig = stateDiagram.get(protoType) || [];
        let result = new Set();
        let plain = [];
        let forceTo = [];
        const allState = new Set();
        const parent = Object.getPrototypeOf(protoType);
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
        Object.defineProperties(protoType, {
            stateDiagram: { value },
            allStates: { value: allState }
        });
        return value;
    }
    static STATECHANGED = 'stateChanged';
    static UPDATEAFSM = 'updateAFSM';
    static INIT = "[*]"; //初始状态
    static ON = "on";
    static OFF = "off";
    static instances = new Map();
    static instances2 = new WeakMap();
    static get(context) {
        let fsm;
        if (typeof context === 'string') {
            fsm = FSM.instances.get(context);
            if (!fsm) {
                FSM.instances.set(context, fsm = new FSM(context, undefined, Object.create(FSM.prototype)));
            }
        }
        else {
            fsm = FSM.instances2.get(context);
            if (!fsm) {
                FSM.instances2.set(context, fsm = new FSM(context.constructor.name, undefined, Object.create(FSM.prototype)));
            }
        }
        return fsm;
    }
    static getState(context) {
        return FSM.get(context)?.state;
    }
    _state = FSM.INIT;
    [cacheResult];
    [abortCtrl];
    constructor(name, groupName, prototype) {
        super();
        this.name = name;
        this.groupName = groupName;
        if (!name)
            name = Date.now().toString(36);
        if (!prototype)
            prototype = Object.getPrototypeOf(this);
        else
            Object.setPrototypeOf(this, prototype);
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
    set state(value) {
        setState.call(this, value);
    }
}
export { FSM };
//# sourceMappingURL=index.js.map