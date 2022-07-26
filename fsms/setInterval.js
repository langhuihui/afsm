var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { FSM, ChangeState } from '../index';
export class SetInterval extends FSM {
    id;
    constructor(name) {
        super(name, "setInterval");
    }
    async start(ms, ...args) {
        this.id = setInterval(() => {
            this.emit("interval", ...args);
        }, ms, ...args);
    }
    async stop() {
        clearInterval(this.id);
    }
    async reset(ms, ...args) {
        await this.stop();
        return this.start(ms, ...args);
    }
}
__decorate([
    ChangeState([FSM.INIT, FSM.OFF], FSM.ON)
], SetInterval.prototype, "start", null);
__decorate([
    ChangeState([], FSM.OFF)
], SetInterval.prototype, "stop", null);
//# sourceMappingURL=setInterval.js.map