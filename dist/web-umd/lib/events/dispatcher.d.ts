import CallbackRegistry from './callback_registry';
/** Manages callback bindings and event emitting.
 *
 * @param Function failThrough called when no listeners are bound to an event
 */
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
