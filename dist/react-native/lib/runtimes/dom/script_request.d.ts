import ScriptReceiver from './script_receiver';
/** Sends a generic HTTP GET request using a script tag.
 *
 * By constructing URL in a specific way, it can be used for loading
 * JavaScript resources or JSONP requests. It can notify about errors, but
 * only in certain environments. Please take care of monitoring the state of
 * the request yourself.
 *
 * @param {String} src
 */
export default class ScriptRequest {
    src: string;
    script: any;
    errorScript: any;
    constructor(src: string);
    send(receiver: ScriptReceiver): void;
    /** Cleans up the DOM remains of the script request. */
    cleanup(): void;
}
