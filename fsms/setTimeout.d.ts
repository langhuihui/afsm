import { FSM } from '../index';
export declare class SetTimeout extends FSM {
    id?: number;
    constructor(name?: string);
    start(ms: number, ...args: any[]): Promise<void>;
    timeout(...args: any[]): Promise<void>;
    stop(): Promise<void>;
    reset(ms: number, ...args: any[]): Promise<void>;
}
