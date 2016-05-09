import CallbackRegistry from './callback_registry';
import Callback from './callback';
const global = Function("return this")();

/** Manages callback bindings and event emitting.
 *
 * @param Function failThrough called when no listeners are bound to an event
 */
export default class Dispatcher {
  callbacks: CallbackRegistry;
  global_callbacks: Function[];
  failThrough: Function;

  constructor(failThrough?: Function) {
    this.callbacks = new CallbackRegistry();
    this.global_callbacks = [];
    this.failThrough = failThrough;
  }

  bind(eventName : string, callback : Function, context?: any) {
    this.callbacks.add(eventName, callback, context);
    return this;
  }

  bind_all(callback : Function) {
    this.global_callbacks.push(callback);
    return this;
  }

  unbind(eventName : string, callback : Function, context?: any) {
    this.callbacks.remove(eventName, callback, context);
    return this;
  }

  unbind_all(eventName?: string, callback?: Function) {
    this.callbacks.remove(eventName, callback);
    return this;
  }

  emit(eventName : string, data?: any) : Dispatcher {
    var i;

    for (i = 0; i < this.global_callbacks.length; i++) {
      this.global_callbacks[i](eventName, data);
    }

    var callbacks = this.callbacks.get(eventName);
    if (callbacks && callbacks.length > 0) {
      for (i = 0; i < callbacks.length; i++) {
        callbacks[i].fn.call(callbacks[i].context || global, data);
      }
    } else if (this.failThrough) {
      this.failThrough(eventName, data);
    }

    return this;
  }
}
