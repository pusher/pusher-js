import { ScriptReceiverFactory } from './script_receiver_factory';
/** Handles loading dependency files.
 *
 * Dependency loaders don't remember whether a resource has been loaded or
 * not. It is caller's responsibility to make sure the resource is not loaded
 * twice. This is because it's impossible to detect resource loading status
 * without knowing its content.
 *
 * Options:
 * - cdn_http - url to HTTP CND
 * - cdn_https - url to HTTPS CDN
 * - version - version of pusher-js
 * - suffix - suffix appended to all names of dependency files
 *
 * @param {Object} options
 */
export default class DependencyLoader {
    options: any;
    receivers: ScriptReceiverFactory;
    loading: any;
    constructor(options: any);
    /** Loads the dependency from CDN.
     *
     * @param  {String} name
     * @param  {Function} callback
     */
    load(name: string, options: any, callback: Function): void;
    getRoot(options: any): string;
    /** Returns a full path to a dependency file.
     *
     * @param {String} name
     * @returns {String}
     */
    getPath(name: string, options: any): string;
}
