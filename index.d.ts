import EventEmitter from 'eventemitter3';
export interface IAFSM extends FSM {
}
export declare type State = string | MiddleState;
export declare class MiddleState {
    oldState: State;
    newState: string;
    action: string;
    error: any;
    constructor(oldState: State, newState: string, action: string);
    toString(): string;
}
export declare function ChangeState(from: string | string[], to: string): (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => void;
export declare class FSM extends EventEmitter {
    name?: string | undefined;
    get stateDiagram(): string[];
    static STATECHANGED: string;
    static UPDATEAFSM: string;
    static INIT: string;
    static ON: string;
    static OFF: string;
    _state: State;
    _cacheResult: any;
    abortCtrl?: {
        aborted: boolean;
    };
    constructor(name?: string | undefined);
    updateDevTools(payload: any): void;
    get state(): State;
}
