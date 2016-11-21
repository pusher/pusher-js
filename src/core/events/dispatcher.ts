import * as Collections from '../utils/collections';
import Callback from './callback';
import CallbackRegistry from './callback_registry';

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

  bind_global(callback : Function) {
    this.global_callbacks.push(callback);
    return this;
  }

  unbind(eventName? : string, callback? : Function, context?: any) {
    this.callbacks.remove(eventName, callback, context);
    return this;
  }

  unbind_global(callback?: Function) {
    if (!callback) {
      this.global_callbacks = [];
      return this;
    }

    this.global_callbacks = Collections.filter(
      this.global_callbacks || [],
      c => c !== callback
    );

    return this;
  }

  unbind_all() {
    this.unbind();
    this.unbind_global();
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
