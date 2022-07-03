import EventEmitter from 'eventemitter3';
export interface IAFSM extends FSM {
}
export declare type State = string | MiddleState;
export declare class MiddleState {
    oldState: State;
    newState: string;
    action: string;
    constructor(oldState: State, newState: string, action: string);
    toString(): string;
}
export declare function ChangeState(from: string | string[], to: string): (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => void;
export declare class FSM extends EventEmitter {
    name?: string | undefined;
    static STATECHANGED: string;
    static EABORT: Error;
    static ESTATE: Error;
    static INIT: string;
    get stateDiagram(): never[];
    _state: State;
    abortCtrl?: {
        aborted: boolean;
    };
    constructor(name?: string | undefined);
    get state(): State;
    set state(value: State);
}
