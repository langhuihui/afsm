var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import EventEmitter from 'eventemitter3';
const fromsKey = Symbol('froms');
export function From(...from) {
    return (target, propertyKey, descriptor) => {
        target[fromsKey] = target[fromsKey] || {};
        target[fromsKey][propertyKey] = target[fromsKey][propertyKey] || [];
        target[fromsKey][propertyKey].push(...from);
    };
}
export function To(state) {
    return (target, propertyKey, descriptor) => {
        const origin = descriptor.value;
        descriptor.value = function (...arg) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                const froms = (_a = target === null || target === void 0 ? void 0 : target[fromsKey]) === null || _a === void 0 ? void 0 : _a[propertyKey];
                if (froms) {
                    if ((!froms.includes(this.state)))
                        throw FSM.ESTATE;
                }
                else if (this.abortCtrl) {
                    this.abortCtrl.aborted = true;
                }
                this.state = `${this.state}(${propertyKey})${state}`;
                const abort = { aborted: false };
                this.abortCtrl = abort;
                const result = yield origin.apply(this, arg);
                if (abort.aborted) {
                    throw FSM.EABORT;
                }
                else {
                    this.abortCtrl = void 0;
                }
                this.state = state;
                return result;
            });
        };
    };
}
export class FSM extends EventEmitter {
    constructor() {
        super(...arguments);
        this._state = "";
    }
    get state() {
        return this._state;
    }
    set state(value) {
        const old = this._state;
        console.log(`${this.constructor.name} state change from ${this._state} to ${value}`);
        this._state = value;
        this.emit(value, old);
        this.emit(FSM.STATECHANGED, old, value);
    }
}
FSM.STATECHANGED = 'stateChanged';
FSM.EABORT = new Error('abort');
FSM.ESTATE = new Error('wrong state');
export class AFSM extends FSM {
    start() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    forceStop() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
AFSM.OFF = 'off';
AFSM.ON = 'on';
AFSM.INIT = '';
__decorate([
    From(AFSM.OFF, AFSM.INIT),
    To(AFSM.ON)
], AFSM.prototype, "start", null);
__decorate([
    From(AFSM.ON),
    To(AFSM.OFF)
], AFSM.prototype, "stop", null);
__decorate([
    To(AFSM.OFF)
], AFSM.prototype, "forceStop", null);
