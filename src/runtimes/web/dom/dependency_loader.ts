import {ScriptReceivers, ScriptReceiverFactory} from './script_receiver_factory';
import Runtime from 'runtime';
import ScriptRequest from './script_request';

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

   constructor(options : any) {
     this.options = options;
     this.receivers = options.receivers || ScriptReceivers;
     this.loading = {};
   }

   /** Loads the dependency from CDN.
    *
    * @param  {String} name
    * @param  {Function} callback
    */
   load(name : string, options: any, callback : Function) {
     var self = this;

     if (self.loading[name] && self.loading[name].length > 0) {
       self.loading[name].push(callback);
     } else {
       self.loading[name] = [callback];

       var request = Runtime.createScriptRequest(self.getPath(name, options));
       var receiver = self.receivers.create(function(error) {
         self.receivers.remove(receiver);

         if (self.loading[name]) {
           var callbacks = self.loading[name];
           delete self.loading[name];

           var successCallback = function(wasSuccessful) {
             if (!wasSuccessful) {
               request.cleanup();
             }
           };
           for (var i = 0; i < callbacks.length; i++) {
             callbacks[i](error, successCallback);
           }
         }
       });
       request.send(receiver);
     }
   }

   /** Returns a root URL for pusher-js CDN.
    *
    * @returns {String}
    */
   getRoot(options : any) : string {
     var cdn;
     var protocol = Runtime.getDocument().location.protocol;
     if ((options && options.useTLS) || protocol === "https:") {
       cdn = this.options.cdn_https;
     } else {
       cdn = this.options.cdn_http;
     }
     // make sure there are no double slashes
     return cdn.replace(/\/*$/, "") + "/" + this.options.version;
   }

   /** Returns a full path to a dependency file.
    *
    * @param {String} name
    * @returns {String}
    */
   getPath(name : string, options : any) : string {
     return this.getRoot(options) + '/' + name + this.options.suffix + '.js';
   };
}
