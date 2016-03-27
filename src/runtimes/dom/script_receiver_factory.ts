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
 export class ScriptReceiverFactory {
   lastId: number;
   prefix: string;
   name: string;

   constructor(prefix : string, name : string) {
     this.lastId = 0;
     this.prefix = prefix;
     this.name = name;
   }

   create(callback : Function) : ScriptReceiver {
     this.lastId++;

     var number = this.lastId;
     var id = this.prefix + number;
     var name = this.name + "[" + number + "]";

     var called = false;
     var callbackWrapper = function() {
       if (!called) {
         callback.apply(null, arguments);
         called = true;
       }
     };

     this[number] = callbackWrapper;
     return { number: number, id: id, name: name, callback: callbackWrapper };
   }

   remove(receiver : ScriptReceiver) {
     delete this[receiver.number];
   }
 }

 export var ScriptReceivers = new ScriptReceiverFactory(
   "_pusher_script_", "Pusher.ScriptReceivers"
 );
