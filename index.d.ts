import EventEmitter from 'eventemitter3';
export interface IAFSM extends AFSM {
}
export declare function From(...from: string[]): MethodDecorator;
export declare function To(state: string): MethodDecorator;
export declare class FSM extends EventEmitter {
    _state: string;
    abortCtrl?: {
        aborted: boolean;
    };
    static STATECHANGED: string;
    static EABORT: Error;
    static ESTATE: Error;
    get state(): string;
    set state(value: string);
}
export declare class AFSM extends FSM {
    static OFF: string;
    static ON: string;
    static INIT: string;
    start(): Promise<void>;
    stop(): Promise<void>;
    forceStop(): Promise<void>;
}
