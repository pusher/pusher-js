import base64encode from '../base64';
import Util from '../util';

/** Merges multiple objects into the target argument.
 *
 * For properties that are plain Objects, performs a deep-merge. For the
 * rest it just copies the value of the property.
 *
 * To extend prototypes use it as following:
 *   Pusher.Util.extend(Target.prototype, Base.prototype)
 *
 * You can also use it to merge objects without altering them:
 *   Pusher.Util.extend({}, object1, object2)
 *
 * @param  {Object} target
 * @return {Object} the target argument
 */
export function extend<T>(target: any, ...sources: any[]): T {
  for (var i = 0; i < sources.length; i++) {
    var extensions = sources[i];
    for (var property in extensions) {
      if (
        extensions[property] &&
        extensions[property].constructor &&
        extensions[property].constructor === Object
      ) {
        target[property] = extend(target[property] || {}, extensions[property]);
      } else {
        target[property] = extensions[property];
      }
    }
  }
  return target;
}

export function stringify(): string {
  var m = ['Pusher'];
  for (var i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] === 'string') {
      m.push(arguments[i]);
    } else {
      m.push(safeJSONStringify(arguments[i]));
    }
  }
  return m.join(' : ');
}

export function arrayIndexOf(array: any[], item: any): number {
  // MSIE doesn't have array.indexOf
  var nativeIndexOf = Array.prototype.indexOf;
  if (array === null) {
    return -1;
  }
  if (nativeIndexOf && array.indexOf === nativeIndexOf) {
    return array.indexOf(item);
  }
  for (var i = 0, l = array.length; i < l; i++) {
    if (array[i] === item) {
      return i;
    }
  }
  return -1;
}

/** Applies a function f to all properties of an object.
 *
 * Function f gets 3 arguments passed:
 * - element from the object
 * - key of the element
 * - reference to the object
 *
 * @param {Object} object
 * @param {Function} f
 */
export function objectApply(object: any, f: Function) {
  for (var key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      f(object[key], key, object);
    }
  }
}

/** Return a list of objects own proerty keys
 *
 * @param {Object} object
 * @returns {Array}
 */
export function keys(object: any): string[] {
  var keys = [];
  objectApply(object, function(_, key) {
    keys.push(key);
  });
  return keys;
}

/** Return a list of object's own property values
 *
 * @param {Object} object
 * @returns {Array}
 */
export function values(object: any): any[] {
  var values = [];
  objectApply(object, function(value) {
    values.push(value);
  });
  return values;
}

/** Applies a function f to all elements of an array.
 *
 * Function f gets 3 arguments passed:
 * - element from the array
 * - index of the element
 * - reference to the array
 *
 * @param {Array} array
 * @param {Function} f
 */
export function apply(array: any[], f: Function, context?: any) {
  for (var i = 0; i < array.length; i++) {
    f.call(context || global, array[i], i, array);
  }
}

/** Maps all elements of the array and returns the result.
 *
 * Function f gets 4 arguments passed:
 * - element from the array
 * - index of the element
 * - reference to the source array
 * - reference to the destination array
 *
 * @param {Array} array
 * @param {Function} f
 */
export function map(array: any[], f: Function): any[] {
  var result = [];
  for (var i = 0; i < array.length; i++) {
    result.push(f(array[i], i, array, result));
  }
  return result;
}

/** Maps all elements of the object and returns the result.
 *
 * Function f gets 4 arguments passed:
 * - element from the object
 * - key of the element
 * - reference to the source object
 * - reference to the destination object
 *
 * @param {Object} object
 * @param {Function} f
 */
export function mapObject(object: any, f: Function): any {
  var result = {};
  objectApply(object, function(value, key) {
    result[key] = f(value);
  });
  return result;
}

/** Filters elements of the array using a test function.
 *
 * Function test gets 4 arguments passed:
 * - element from the array
 * - index of the element
 * - reference to the source array
 * - reference to the destination array
 *
 * @param {Array} array
 * @param {Function} f
 */
export function filter(array: any[], test: Function): any[] {
  test =
    test ||
    function(value) {
      return !!value;
    };

  var result = [];
  for (var i = 0; i < array.length; i++) {
    if (test(array[i], i, array, result)) {
      result.push(array[i]);
    }
  }
  return result;
}

/** Filters properties of the object using a test function.
 *
 * Function test gets 4 arguments passed:
 * - element from the object
 * - key of the element
 * - reference to the source object
 * - reference to the destination object
 *
 * @param {Object} object
 * @param {Function} f
 */
export function filterObject(object: Object, test: Function) {
  var result = {};
  objectApply(object, function(value, key) {
    if ((test && test(value, key, object, result)) || Boolean(value)) {
      result[key] = value;
    }
  });
  return result;
}

/** Flattens an object into a two-dimensional array.
 *
 * @param  {Object} object
 * @return {Array} resulting array of [key, value] pairs
 */
export function flatten(object: Object): any[] {
  var result = [];
  objectApply(object, function(value, key) {
    result.push([key, value]);
  });
  return result;
}

/** Checks whether any element of the array passes the test.
 *
 * Function test gets 3 arguments passed:
 * - element from the array
 * - index of the element
 * - reference to the source array
 *
 * @param {Array} array
 * @param {Function} f
 */
export function any(array: any[], test: Function): boolean {
  for (var i = 0; i < array.length; i++) {
    if (test(array[i], i, array)) {
      return true;
    }
  }
  return false;
}

/** Checks whether all elements of the array pass the test.
 *
 * Function test gets 3 arguments passed:
 * - element from the array
 * - index of the element
 * - reference to the source array
 *
 * @param {Array} array
 * @param {Function} f
 */
export function all(array: any[], test: Function): boolean {
  for (var i = 0; i < array.length; i++) {
    if (!test(array[i], i, array)) {
      return false;
    }
  }
  return true;
}

export function encodeParamsObject(data): string {
  return mapObject(data, function(value) {
    if (typeof value === 'object') {
      value = safeJSONStringify(value);
    }
    return encodeURIComponent(base64encode(value.toString()));
  });
}

export function buildQueryString(data: any): string {
  var params = filterObject(data, function(value) {
    return value !== undefined;
  });

  var query = map(
    flatten(encodeParamsObject(params)),
    Util.method('join', '=')
  ).join('&');

  return query;
}

/**
 * See https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 *
 * Remove circular references from an object. Required for JSON.stringify in
 * React Native, which tends to blow up a lot.
 *
 * @param  {any} object
 * @return {any}        Decycled object
 */
export function decycleObject(object: any): any {
  var objects = [],
    paths = [];

  return (function derez(value, path) {
    var i, name, nu;

    switch (typeof value) {
      case 'object':
        if (!value) {
          return null;
        }
        for (i = 0; i < objects.length; i += 1) {
          if (objects[i] === value) {
            return { $ref: paths[i] };
          }
        }

        objects.push(value);
        paths.push(path);

        if (Object.prototype.toString.apply(value) === '[object Array]') {
          nu = [];
          for (i = 0; i < value.length; i += 1) {
            nu[i] = derez(value[i], path + '[' + i + ']');
          }
        } else {
          nu = {};
          for (name in value) {
            if (Object.prototype.hasOwnProperty.call(value, name)) {
              nu[name] = derez(
                value[name],
                path + '[' + JSON.stringify(name) + ']'
              );
            }
          }
        }
        return nu;
      case 'number':
      case 'string':
      case 'boolean':
        return value;
    }
  })(object, '$');
}

/**
 * Provides a cross-browser and cross-platform way to safely stringify objects
 * into JSON. This is particularly necessary for ReactNative, where circular JSON
 * structures throw an exception.
 *
 * @param  {any}    source The object to stringify
 * @return {string}        The serialized output.
 */
export function safeJSONStringify(source: any): string {
  try {
    return JSON.stringify(source);
  } catch (e) {
    return JSON.stringify(decycleObject(source));
  }
}
