import { EventEmitter } from 'eventemitter3';
export declare const enum AFSM_ACTION {
    START = "start",
    START_SUCCESS = "startSuccess",
    START_FAILED = "startFailed",
    STOP = "stop",
    STOP_SUCCESS = "stopSuccess",
    STOP_FAILED = "stopFailed"
}
export declare const enum AFSM_STATE {
    IDLE = 0,
    STARTING = 1,
    RUNNING = 2,
    STOPING = 3
}
export interface AFSMopt {
    parent?: AFSM;
    name?: string;
    quickStart?: boolean;
    quickStop?: boolean;
}
export declare class AFSM extends EventEmitter {
    option?: AFSMopt | undefined;
    state: AFSM_STATE;
    get running(): boolean;
    get quickStop(): boolean;
    get quickStart(): boolean;
    name: string;
    constructor(option?: AFSMopt | undefined);
    get ready(): Promise<unknown>;
    get closed(): Promise<unknown>;
    start(...args: any[]): boolean;
    startSuccess(...args: any[]): boolean;
    startFailed(...args: any[]): boolean;
    stop(...args: any[]): boolean;
    stopSuccess(...args: any[]): boolean;
    stopFailed(...args: any[]): boolean;
    private action;
}
