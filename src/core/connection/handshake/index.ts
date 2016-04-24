import Util from '../../util';
import * as Collections from '../../utils/collections';
import * as Protocol from '../protocol/protocol';
import Connection from '../connection';
import TransportConnection from "../../transports/transport_connection";
import HandshakeResults from './handshake_results';
import HandshakePayload from './handshake_payload';

/**
 * Handles Pusher protocol handshakes for transports.
 *
 * Calls back with a result object after handshake is completed. Results
 * always have two fields:
 * - action - string describing action to be taken after the handshake
 * - transport - the transport object passed to the constructor
 *
 * Different actions can set different additional properties on the result.
 * In the case of 'connected' action, there will be a 'connection' property
 * containing a Connection object for the transport. Other actions should
 * carry an 'error' property.
 *
 * @param {AbstractTransport} transport
 * @param {Function} callback
 */
export default class Handshake {
  transport: TransportConnection;
  callback: (HandshakePayload)=>void;
  onMessage: Function;
  onClosed: Function;

  constructor(transport : TransportConnection, callback : (HandshakePayload)=>void) {
    this.transport = transport;
    this.callback = callback;
    this.bindListeners();
  }

  close() {
    this.unbindListeners();
    this.transport.close();
  }

  private bindListeners() {
    this.onMessage = (m)=> {
      this.unbindListeners();

      try {
        var result = Protocol.processHandshake(m);
        if (result.action === <any>HandshakeResults.CONNECTED) {
          this.finish(HandshakeResults.CONNECTED, {
            connection: new Connection(result.id, this.transport),
            activityTimeout: result.activityTimeout
          });
        } else {
          this.finish(result.action, { error: result.error });
          this.transport.close();
        }
      } catch (e) {
        this.finish(HandshakeResults.ERROR, { error: e });
        this.transport.close();
      }
    };

    this.onClosed = (closeEvent) => {
      this.unbindListeners();

      var action = Protocol.getCloseAction(closeEvent) || HandshakeResults.BACKOFF;
      var error = Protocol.getCloseError(closeEvent);
      this.finish(action, { error: error });
    };

    this.transport.bind("message", this.onMessage);
    this.transport.bind("closed", this.onClosed);
  }

  private unbindListeners() {
    this.transport.unbind("message", this.onMessage);
    this.transport.unbind("closed", this.onClosed);
  }

  private finish(action : HandshakeResults, params : any) {
    this.callback(
      Collections.extend({ transport: this.transport, action: action }, params)
    );
  }

}
