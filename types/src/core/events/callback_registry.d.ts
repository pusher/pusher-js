import Callback from './callback';
import CallbackTable from './callback_table';
export default class CallbackRegistry {
    _callbacks: CallbackTable;
    constructor();
    get(name: string): Callback[];
    add(name: string, callback: Function, context: any): void;
    remove(name?: string, callback?: Function, context?: any): void;
    private removeCallback;
    private removeAllCallbacks;
}
