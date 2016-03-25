import Callback from "./callback";
import * as Util from '../utils/collections';
import CallbackTable from "./callback_table";

export default class CallbackRegistry {
  _callbacks: CallbackTable;

  constructor() {
    this._callbacks = {};
  }

  get(name : string) : Callback[] {
    return this._callbacks[prefix(name)];
  }

  add(name : string, callback : Function, context : any) {
    var prefixedEventName = prefix(name);
    this._callbacks[prefixedEventName] = this._callbacks[prefixedEventName] || [];
    this._callbacks[prefixedEventName].push({
      fn: callback,
      context: context
    });
  }

  remove(name?: string, callback?: Function, context?: any) {
    if (!name && !callback && !context) {
      this._callbacks = {};
      return;
    }

    var names = name ? [prefix(name)] : Util.keys(this._callbacks);

    if (callback || context) {
      Util.apply(names, function(name) {
        this._callbacks[name] = Util.filter(
          this._callbacks[name] || [],
          function(binding) {
            return (callback && callback !== binding.fn) ||
                   (context && context !== binding.context);
          }
        );
        if (this._callbacks[name].length === 0) {
          delete this._callbacks[name];
        }
      }, this);
    } else {
      Util.apply(names, function(name) {
        delete this._callbacks[name];
      }, this);
    }
  }
}

function prefix(name : string) : string {
  return "_" + name;
}
