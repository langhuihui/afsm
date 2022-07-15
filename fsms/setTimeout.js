var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { FSM, ChangeState } from '../index';
export class SetTimeout extends FSM {
    id;
    constructor(name) {
        super(name, "setTimeout");
    }
    async start(ms, ...args) {
        this.id = setTimeout(() => {
            this.timeout();
        }, ms, ...args);
    }
    async timeout(...args) {
        this.emit("timeout", ...args);
    }
    async stop() {
        clearTimeout(this.id);
    }
    async reset(ms, ...args) {
        await this.stop();
        return this.start(ms, ...args);
    }
}
__decorate([
    ChangeState([FSM.INIT, FSM.OFF], FSM.ON)
], SetTimeout.prototype, "start", null);
__decorate([
    ChangeState(FSM.ON, FSM.OFF)
], SetTimeout.prototype, "timeout", null);
__decorate([
    ChangeState([], FSM.INIT)
], SetTimeout.prototype, "stop", null);
