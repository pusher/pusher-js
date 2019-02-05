import * as Collections from '../utils/collections';
import Callback from './callback';
import Metadata from '../channels/metadata';
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

  emit(eventName : string, data?: any, metadata?: Metadata) : Dispatcher {
    for (var i = 0; i < this.global_callbacks.length; i++) {
      this.global_callbacks[i](eventName, data);
    }

    var callbacks = this.callbacks.get(eventName);
    var args = [];

    if (metadata) {

      // if there's a metadata argument, we need to call the callback with both
      // data and metadata regardless of whether data is undefined
      args.push(data, metadata)
    } else if (data) {

      // metadata is undefined, so we only need to call the callback with data
      // if data exists
      args.push(data)
    }

    if (callbacks && callbacks.length > 0) {
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i].fn.apply(callbacks[i].context || global, args);
      }
    } else if (this.failThrough) {
      this.failThrough(eventName, data);
    }

    return this;
  }
}
