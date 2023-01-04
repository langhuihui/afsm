import EventEmitter from 'eventemitter3';
export interface IAFSM extends FSM {
}
declare const abortCtrl: unique symbol;
declare const cacheResult: unique symbol;
export declare type State = string | MiddleState;
export interface ChangeOption {
    ignoreError?: boolean;
    action?: string;
    success?: (this: IAFSM, result: any) => void;
    fail?: (this: IAFSM, err: FSMError) => void;
}
export declare class MiddleState {
    oldState: State;
    newState: string;
    action: string;
    error: any;
    constructor(oldState: State, newState: string, action: string);
    toString(): string;
}
export declare class FSMError extends Error {
    state: State;
    message: string;
    cause?: Error | undefined;
    constructor(state: State, message: string, cause?: Error | undefined);
}
export declare function ChangeState(from: string | string[], to: string, opt?: ChangeOption): (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => void;
export declare function tryChangeState(from: string | string[], to: string, opt?: ChangeOption): void;
export declare function Includes(...states: string[]): (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => void;
export declare function Excludes(...states: string[]): (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => void;
export declare function ActionState(name?: string): (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => void;
interface FSMEventTypes {
    stateChanged: [State, State, any];
}
export declare class FSM<EventTypes extends EventEmitter.ValidEventTypes = string | symbol, Context extends any = any> extends EventEmitter<EventTypes | FSMEventTypes, Context> {
    name?: string | undefined;
    groupName?: string | undefined;
    get stateDiagram(): string[];
    static readonly STATECHANGED = "stateChanged";
    static readonly UPDATEAFSM = "updateAFSM";
    static readonly INIT = "[*]";
    static readonly ON = "on";
    static readonly OFF = "off";
    _state: State;
    [cacheResult]: any;
    [abortCtrl]?: {
        aborted: boolean;
    };
    constructor(name?: string | undefined, groupName?: string | undefined);
    updateDevTools(payload?: any): void;
    get state(): State;
    set state(value: State);
}
export {};
//# sourceMappingURL=index.d.ts.map