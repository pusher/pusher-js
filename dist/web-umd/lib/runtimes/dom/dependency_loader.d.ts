import { ScriptReceiverFactory } from './script_receiver_factory';
export default class DependencyLoader {
    options: any;
    receivers: ScriptReceiverFactory;
    loading: any;
    constructor(options: any);
    load(name: string, options: any, callback: Function): void;
    getRoot(options: any): string;
    getPath(name: string, options: any): string;
}
