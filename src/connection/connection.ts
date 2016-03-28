import * as Collections from '../utils/collections';
import {default as EventsDispatcher} from '../events/dispatcher';
import * as Protocol from './protocol/protocol';
import Message from './protocol/message';
import Logger from '../logger';
import TransportConnection from "../transports/transport_connection";
import Socket from "../socket/socket";
/**
 * Provides Pusher protocol interface for transports.
 *
 * Emits following events:
 * - message - on received messages
 * - ping - on ping requests
 * - pong - on pong responses
 * - error - when the transport emits an error
 * - closed - after closing the transport
 *
 * It also emits more events when connection closes with a code.
 * See Protocol.getCloseAction to get more details.
 *
 * @param {Number} id
 * @param {AbstractTransport} transport
 */
export default class Connection extends EventsDispatcher implements Socket {
  id: string;
  transport: TransportConnection;
  activityTimeout: number;

  constructor(id : string, transport : TransportConnection) {
    super();
    this.id = id;
    this.transport = transport;
    this.activityTimeout = transport.activityTimeout;
    this.bindListeners();
  }

  /** Returns whether used transport handles activity checks by itself
   *
   * @returns {Boolean} true if activity checks are handled by the transport
   */
  handlesActivityChecks(){
    return this.transport.handlesActivityChecks();
  }

  /** Sends raw data.
   *
   * @param {String} data
   */
  send(data : any) : boolean {
    return this.transport.send(data);
  }

  /** Sends an event.
   *
   * @param {String} name
   * @param {String} data
   * @param {String} [channel]
   * @returns {Boolean} whether message was sent or not
   */
   send_event(name : string, data : any, channel?: string) : boolean {
     var message : Message = { event: name, data: data };
     if (channel) {
       message.channel = channel;
     }
     Logger.debug('Event sent', message);
     return this.send(Protocol.encodeMessage(message));
   }

   /** Sends a ping message to the server.
    *
    * Basing on the underlying transport, it might send either transport's
    * protocol-specific ping or pusher:ping event.
    */
   ping() {
     if (this.transport.supportsPing()) {
       this.transport.ping();
     } else {
       this.send_event('pusher:ping', {});
     }
   }

   /** Closes the connection. */
   close() {
     this.transport.close();
   }

   /** @private */
   bindListeners() {
     var self = this;

     var listeners = {
       message: function(m) {
         var message;
         try {
           message = Protocol.decodeMessage(m);
         } catch(e) {
           self.emit('error', {
             type: 'MessageParseError',
             error: e,
             data: m.data
           });
         }

         if (message !== undefined) {
           Logger.debug('Event recd', message);

           switch (message.event) {
             case 'pusher:error':
               self.emit('error', { type: 'PusherError', data: message.data });
               break;
             case 'pusher:ping':
               self.emit("ping");
               break;
             case 'pusher:pong':
               self.emit("pong");
               break;
           }
           self.emit('message', message);
         }
       },
       activity: function() {
         self.emit("activity");
       },
       error: function(error) {
         self.emit("error", { type: "WebSocketError", error: error });
       },
       closed: function(closeEvent) {
         unbindListeners();

         if (closeEvent && closeEvent.code) {
           self.handleCloseEvent(closeEvent);
         }

         self.transport = null;
         self.emit("closed");
       }
     };

     var unbindListeners = function() {
       Collections.objectApply(listeners, function(listener, event) {
         self.transport.unbind(event, listener);
       });
     };

     Collections.objectApply(listeners, function(listener, event) {
       self.transport.bind(event, listener);
     });
   }

   /** @private */
   handleCloseEvent(closeEvent : any) {
     var action = Protocol.getCloseAction(closeEvent);
     var error = Protocol.getCloseError(closeEvent);
     if (error) {
       this.emit('error', error);
     }
     if (action) {
       this.emit(<any>action);
     }
   }
}
