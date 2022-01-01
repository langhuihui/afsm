import { EventEmitter } from 'eventemitter3';
;
// 四冲程序状态机
const Transitions = [
    {
        ["start" /* START */]: 1 /* STARTING */,
    },
    {
        ["startSuccess" /* START_SUCCESS */]: 2 /* RUNNING */,
        ["startFailed" /* START_FAILED */]: 0 /* IDLE */,
        ["stop" /* STOP */]: 3 /* STOPING */,
    },
    {
        ["stop" /* STOP */]: 3 /* STOPING */,
    },
    {
        ["stopSuccess" /* STOP_SUCCESS */]: 0 /* IDLE */,
        ["stopFailed" /* STOP_FAILED */]: 2 /* RUNNING */
    }
];
export class AFSM extends EventEmitter {
    constructor(option) {
        super();
        this.option = option;
        this.state = 0 /* IDLE */;
        this.name = (option === null || option === void 0 ? void 0 : option.name) || this.constructor.name;
        if (option === null || option === void 0 ? void 0 : option.parent) {
            // 级联关闭
            option.parent.on("stop" /* STOP */, this.stop.bind(this));
        }
    }
    get running() {
        return this.state == 2 /* RUNNING */;
    }
    // 快速关闭，无需等待
    get quickStop() {
        var _a;
        return !(((_a = this.option) === null || _a === void 0 ? void 0 : _a.quickStop) === false);
    }
    ;
    get quickStart() {
        var _a;
        return !(((_a = this.option) === null || _a === void 0 ? void 0 : _a.quickStart) === false);
    }
    ;
    start(...args) {
        var _a;
        if (((_a = this.option) === null || _a === void 0 ? void 0 : _a.parent) && !this.option.parent.running) {
            return false;
        }
        return this.action("start" /* START */, ...args) && (!this.quickStart || this.startSuccess(...args));
    }
    startSuccess(...args) {
        return this.action("startSuccess" /* START_SUCCESS */, ...args);
    }
    startFailed(...args) {
        return this.action("startFailed" /* START_FAILED */, ...args);
    }
    stop(...args) {
        return this.action("stop" /* STOP */, ...args) && (!this.quickStop || this.stopSuccess());
    }
    stopSuccess(...args) {
        return this.action("stopSuccess" /* STOP_SUCCESS */, ...args);
    }
    stopFailed(...args) {
        return this.action("stopFailed" /* STOP_FAILED */, ...args);
    }
    action(event, ...args) {
        var _a;
        // @ts-ignore
        const to = (_a = Transitions[this.state]) === null || _a === void 0 ? void 0 : _a[event];
        if (typeof to == 'number') {
            this.state = to;
            // console.log(this.name, event, from, '->', to, ...args);
            this.emit(event, ...args);
            return true;
        }
        return false;
    }
}
