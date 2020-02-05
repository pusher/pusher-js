import Metadata from '../channels/metadata';
import CallbackRegistry from './callback_registry';
export default class Dispatcher {
    callbacks: CallbackRegistry;
    global_callbacks: Function[];
    failThrough: Function;
    constructor(failThrough?: Function);
    bind(eventName: string, callback: Function, context?: any): this;
    bind_global(callback: Function): this;
    unbind(eventName?: string, callback?: Function, context?: any): this;
    unbind_global(callback?: Function): this;
    unbind_all(): this;
    emit(eventName: string, data?: any, metadata?: Metadata): Dispatcher;
}
