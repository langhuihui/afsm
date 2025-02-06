import EventEmitter from 'eventemitter3';
const instance = Symbol('instance');
const abortCtrl = Symbol('abortCtrl');
const cacheResult = Symbol('cacheResult');
// 中间过渡状态
export class MiddleState {
    constructor(oldState, newState, action) {
        this.oldState = oldState;
        this.newState = newState;
        this.action = action;
        this.aborted = false;
    }
    abort(fsm) {
        this.aborted = true;
        setState.call(fsm, this.oldState, new Error(`action '${this.action}' aborted`));
    }
    toString() {
        return `${this.action}ing`;
    }
}
export class FSMError extends Error {
    /*************  ✨ Codeium Command ⭐  *************/
    /**
     * Create a new instance of FSMError.
     * @param state current state.
     * @param message error message.
     * @param cause original error.
  /******  625fa23f-3ee1-42ac-94bd-4f6ffd4578ff  *******/
    constructor(state, message, cause) {
        super(message);
        this.state = state;
        this.message = message;
        this.cause = cause;
    }
}
function thenAble(val) {
    return typeof val === 'object' && val && 'then' in val;
}
const stateDiagram = new Map();
// const originPromise = Object.getPrototypeOf((async () => { })()).constructor;
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
        descriptor.value = function (...arg) {
            let fsm = this;
            if (opt.context) {
                // @ts-ignore
                fsm = FSM.get(typeof opt.context === 'function' ? opt.context.call(this, ...arg) : opt.context);
            }
            if (fsm.state === to)
                return opt.sync ? fsm[cacheResult] : Promise.resolve(fsm[cacheResult]);
            else if (fsm.state instanceof MiddleState) {
                if (fsm.state.action == opt.abortAction) {
                    fsm.state.abort(fsm);
                }
            }
            let err = null;
            if (Array.isArray(from)) {
                if (from.length == 0) {
                    if (fsm.state instanceof MiddleState)
                        fsm.state.abort(fsm);
                }
                else if ((typeof fsm.state != "string" || !from.includes(fsm.state))) {
                    err = new FSMError(fsm._state, `${fsm.name} ${action} to ${to} failed: current state ${fsm._state} not from ${from.join('|')}`);
                }
            }
            else {
                if (from !== fsm.state) {
                    err = new FSMError(fsm._state, `${fsm.name} ${action} to ${to} failed: current state ${fsm._state} not from ${from}`);
                }
            }
            const returnErr = (err) => {
                if (opt.fail)
                    opt.fail.call(this, err);
                if (opt.sync) {
                    if (opt.ignoreError)
                        return err;
                    throw err;
                }
                else {
                    if (opt.ignoreError)
                        return Promise.resolve(err);
                    return Promise.reject(err);
                }
            };
            if (err)
                return returnErr(err);
            const old = fsm.state;
            const middle = new MiddleState(old, to, action);
            setState.call(fsm, middle);
            const success = (result) => {
                var _a;
                fsm[cacheResult] = result;
                if (!middle.aborted) {
                    setState.call(fsm, to);
                    (_a = opt.success) === null || _a === void 0 ? void 0 : _a.call(this, fsm[cacheResult]);
                }
                return result;
            };
            const failed = (err) => {
                setState.call(fsm, old, err);
                return returnErr(err);
            };
            try {
                const result = origin.apply(this, arg);
                if (thenAble(result))
                    return result.then(success).catch(failed);
                else
                    return opt.sync ? success(result) : Promise.resolve(success(result));
            }
            catch (err) {
                return failed(new FSMError(fsm._state, `${fsm.name} ${action} from ${from} to ${to} failed: ${err}`, err instanceof Error ? err : new Error(String(err))));
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
        descriptor.value = function (...arg) {
            const old = this.state;
            setState.call(this, action);
            try {
                let result = origin.apply(this, arg);
                const success = (result) => {
                    setState.call(this, old);
                    return result;
                };
                if (thenAble(result))
                    return result.then(success);
                return success(result);
            }
            catch (err) {
                setState.call(this, old, err);
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
    this.updateDevTools({ value, old, err: err instanceof Error ? err.message : String(err) });
}
export class FSM extends EventEmitter {
    constructor(name, groupName, prototype) {
        super();
        this.name = name;
        this.groupName = groupName;
        this._state = FSM.INIT;
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
        var _a;
        return (_a = FSM.get(context)) === null || _a === void 0 ? void 0 : _a.state;
    }
    updateDevTools(payload = {}) {
        sendDevTools(FSM.UPDATEAFSM, Object.assign({ name: this.name, group: this.groupName }, payload));
    }
    get state() {
        return this._state;
    }
    set state(value) {
        setState.call(this, value);
    }
}
FSM.STATECHANGED = 'stateChanged';
FSM.UPDATEAFSM = 'updateAFSM';
FSM.INIT = "[*]"; //初始状态
FSM.ON = "on";
FSM.OFF = "off";
FSM.instances = new Map();
FSM.instances2 = new WeakMap();
//# sourceMappingURL=index.js.map