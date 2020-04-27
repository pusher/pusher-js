import PrivateChannel from './private_channel';
import * as Errors from '../errors';
import Logger from '../logger';
import Pusher from '../pusher';
import { decode as encodeUTF8 } from '@stablelib/utf8';
import { decode as decodeBase64 } from '@stablelib/base64';
import Dispatcher from '../events/dispatcher';
import { PusherEvent } from '../connection/protocol/message-types';
import { AuthorizerCallback } from '../auth/options';
import * as nacl from 'tweetnacl';

/** Extends private channels to provide encrypted channel interface.
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
export default class EncryptedChannel extends PrivateChannel {
  key: Uint8Array = null;
  nacl: nacl;

  constructor(name: string, pusher: Pusher, nacl: nacl) {
    super(name, pusher);
    this.nacl = nacl;
  }

  /** Authorizes the connection to use the channel.
   *
   * @param  {String} socketId
   * @param  {Function} callback
   */
  authorize(socketId: string, callback: AuthorizerCallback) {
    super.authorize(socketId, (error, authData) => {
      if (error) {
        callback(true, authData);
        return;
      }
      let sharedSecret = authData['shared_secret'];
      if (!sharedSecret) {
        let errorMsg = `No shared_secret key in auth payload for encrypted channel: ${this.name}`;
        callback(true, errorMsg);
        return;
      }
      this.key = decodeBase64(sharedSecret);
      delete authData['shared_secret'];
      callback(false, authData);
    });
  }

  trigger(event: string, data: any): boolean {
    throw new Errors.UnsupportedFeature(
      'Client events are not currently supported for encrypted channels'
    );
  }

  /** Handles an event. For internal use only.
   *
   * @param {PusherEvent} event
   */
  handleEvent(event: PusherEvent) {
    var eventName = event.event;
    var data = event.data;
    if (
      eventName.indexOf('pusher_internal:') === 0 ||
      eventName.indexOf('pusher:') === 0
    ) {
      super.handleEvent(event);
      return;
    }
    this.handleEncryptedEvent(eventName, data);
  }

  private handleEncryptedEvent(event: string, data: any): void {
    if (!this.key) {
      Logger.debug(
        'Received encrypted event before key has been retrieved from the authEndpoint'
      );
      return;
    }
    if (!data.ciphertext || !data.nonce) {
      Logger.error(
        'Unexpected format for encrypted event, expected object with `ciphertext` and `nonce` fields, got: ' +
          data
      );
      return;
    }
    let cipherText = decodeBase64(data.ciphertext);
    if (cipherText.length < this.nacl.secretbox.overheadLength) {
      Logger.error(
        `Expected encrypted event ciphertext length to be ${this.nacl.secretbox.overheadLength}, got: ${cipherText.length}`
      );
      return;
    }
    let nonce = decodeBase64(data.nonce);
    if (nonce.length < this.nacl.secretbox.nonceLength) {
      Logger.error(
        `Expected encrypted event nonce length to be ${this.nacl.secretbox.nonceLength}, got: ${nonce.length}`
      );
      return;
    }

    let bytes = this.nacl.secretbox.open(cipherText, nonce, this.key);
    if (bytes === null) {
      Logger.debug(
        'Failed to decrypt an event, probably because it was encrypted with a different key. Fetching a new key from the authEndpoint...'
      );
      // Try a single time to retrieve a new auth key and decrypt the event with it
      // If this fails, a new key will be requested when a new message is received
      this.authorize(this.pusher.connection.socket_id, (error, authData) => {
        if (error) {
          Logger.error(
            `Failed to make a request to the authEndpoint: ${authData}. Unable to fetch new key, so dropping encrypted event`
          );
          return;
        }
        bytes = this.nacl.secretbox.open(cipherText, nonce, this.key);
        if (bytes === null) {
          Logger.error(
            `Failed to decrypt event with new key. Dropping encrypted event`
          );
          return;
        }
        this.emitJSON(event, encodeUTF8(bytes));
        return;
      });
      return;
    }

    this.emitJSON(event, encodeUTF8(bytes));
  }

  emitJSON(eventName: string, data?: any): Dispatcher {
    try {
      this.emit(eventName, JSON.parse(data));
    } catch (e) {
      this.emit(eventName, data);
    }
    return this;
  }
}
