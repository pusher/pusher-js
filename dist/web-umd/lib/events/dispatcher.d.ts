import CallbackRegistry from './callback_registry';
export default class Dispatcher {
    callbacks: CallbackRegistry;
    global_callbacks: Function[];
    failThrough: Function;
    constructor(failThrough?: Function);
    bind(eventName: string, callback: Function, context?: any): this;
    bind_all(callback: Function): this;
    unbind(eventName: string, callback: Function, context?: any): this;
    unbind_all(eventName?: string, callback?: Function): this;
    emit(eventName: string, data?: any): Dispatcher;
}
