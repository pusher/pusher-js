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
export declare function extend(target: any, ...sources: any[]): any;
export declare function stringify(): string;
export declare function arrayIndexOf(array: any[], item: any): number;
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
export declare function objectApply(object: any, f: Function): void;
/** Return a list of objects own proerty keys
*
* @param {Object} object
* @returns {Array}
*/
export declare function keys(object: any): string[];
/** Return a list of object's own property values
*
* @param {Object} object
* @returns {Array}
*/
export declare function values(object: any): any[];
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
export declare function apply(array: any[], f: Function, context?: any): void;
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
export declare function map(array: any[], f: Function): any[];
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
export declare function mapObject(object: any, f: Function): any;
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
export declare function filter(array: any[], test: Function): any[];
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
export declare function filterObject(object: Object, test: Function): {};
/** Flattens an object into a two-dimensional array.
*
* @param  {Object} object
* @return {Array} resulting array of [key, value] pairs
*/
export declare function flatten(object: Object): any[];
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
export declare function any(array: any[], test: Function): boolean;
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
export declare function all(array: any[], test: Function): boolean;
export declare function encodeParamsObject(data: any): string;
