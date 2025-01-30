import Util from '../../util';
import * as Collections from '../../utils/collections';
import Protocol from '../protocol/protocol';
import Connection from '../connection';
import TransportConnection from '../../transports/transport_connection';
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
  callback: (HandshakePayload) => void;
  onMessage: Function;
  onClosed: Function;

  constructor(
    transport: TransportConnection,
    callback: (HandshakePayload) => void,
  ) {
    this.transport = transport;
    this.callback = callback;
    this.bindListeners();
  }

  close() {
    this.unbindListeners();
    this.transport.close();
  }

  private bindListeners() {
    this.onMessage = (m) => {
      this.unbindListeners();

      var result;
      try {
        result = Protocol.processHandshake(m);
      } catch (e) {
        this.finish('error', { error: e });
        this.transport.close();
        return;
      }

      if (result.action === 'connected') {
        this.finish('connected', {
          connection: new Connection(result.id, this.transport),
          activityTimeout: result.activityTimeout,
        });
      } else {
        this.finish(result.action, { error: result.error });
        this.transport.close();
      }
    };

    this.onClosed = (closeEvent) => {
      this.unbindListeners();

      var action = Protocol.getCloseAction(closeEvent) || 'backoff';
      var error = Protocol.getCloseError(closeEvent);
      this.finish(action, { error: error });
    };

    this.transport.bind('message', this.onMessage);
    this.transport.bind('closed', this.onClosed);
  }

  private unbindListeners() {
    this.transport.unbind('message', this.onMessage);
    this.transport.unbind('closed', this.onClosed);
  }

  private finish(action: string, params: any) {
    this.callback(
      Collections.extend({ transport: this.transport, action: action }, params),
    );
  }
}
