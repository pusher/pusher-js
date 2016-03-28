import ScriptReceiver from './script_receiver';
export declare class ScriptReceiverFactory {
    lastId: number;
    prefix: string;
    name: string;
    constructor(prefix: string, name: string);
    create(callback: Function): ScriptReceiver;
    remove(receiver: ScriptReceiver): void;
}
export declare var ScriptReceivers: ScriptReceiverFactory;
