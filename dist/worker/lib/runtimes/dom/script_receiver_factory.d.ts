import ScriptReceiver from './script_receiver';
/** Builds receivers for JSONP and Script requests.
 *
 * Each receiver is an object with following fields:
 * - number - unique (for the factory instance), numerical id of the receiver
 * - id - a string ID that can be used in DOM attributes
 * - name - name of the function triggering the receiver
 * - callback - callback function
 *
 * Receivers are triggered only once, on the first callback call.
 *
 * Receivers can be called by their name or by accessing factory object
 * by the number key.
 *
 * @param {String} prefix the prefix used in ids
 * @param {String} name the name of the object
 */
export declare class ScriptReceiverFactory {
    lastId: number;
    prefix: string;
    name: string;
    constructor(prefix: string, name: string);
    create(callback: Function): ScriptReceiver;
    remove(receiver: ScriptReceiver): void;
}
export declare var ScriptReceivers: ScriptReceiverFactory;
