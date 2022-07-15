import { FSM } from '../index';
export declare class SetInterval extends FSM {
    id?: number;
    constructor(name?: string);
    start(ms: number, ...args: any[]): Promise<void>;
    stop(): Promise<void>;
    reset(ms: number, ...args: any[]): Promise<void>;
}
