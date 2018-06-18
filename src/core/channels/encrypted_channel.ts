import Factory from '../utils/factory';
import PrivateChannel from './private_channel';
import Pusher from '../pusher';
import * as Errors from '../errors';

import {secretbox as naclSecretbox, randomBytes} from 'tweetnacl';
import {
  encodeUTF8,
  decodeBase64,
  encodeBase64,
  decodeUTF8,
} from 'tweetnacl-util';

/** Extends public channels to provide private channel interface.
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
export default class EncryptedChannel extends PrivateChannel {
  key: Uint8Array;
  keyPromise: Promise<Uint8Array>;
  resolveKeyPromise: any;
  rejectKeyPromise: any;

  encryptedDataPrefix: string;

  constructor(name: string, pusher: Pusher) {
    super(name, pusher);
    this.keyPromise = new Promise((resolve, reject) => {
      this.resolveKeyPromise = resolve;
      this.rejectKeyPromise = reject;
    }).then((key: Uint8Array) => {
      this.key = key;
      return key;
    });
    this.encryptedDataPrefix = 'encrypted_data';
  }

  /** Authorizes the connection to use the channel.
   *
   * @param  {String} socketId
   * @param  {Function} callback
   */
  authorize(socketId: string, callback: Function) {
    super.authorize(socketId, (error, authData) => {
      let {auth, shared_secret} = authData;
      if (shared_secret) {
        this.resolveKeyPromise(decodeBase64(shared_secret));
      } else {
        throw new Error('Unable to extract shared secret from auth payload');
      }
      callback(error, {auth});
    });
  }

  /** Triggers an encrypted event */
  triggerEncrypted(event: string, data: any) {
    this.encryptPayload(data).then((encryptedData) => {
      return super.trigger(event, encryptedData);
    });
  }

  /** Handles an event. For internal use only.
   *
   * @param {String} event
   * @param {*} data
   */
  handleEvent(event: string, data: any) {
    if (!this.isEncryptedData(data)) {
      return super.handleEvent(event, data);
    }
    this.decryptPayload(data)
      .then(decryptedData => {
        this.emit(event, decryptedData);
      })
      .catch(err => {
        throw new Error(`Unable to decrypted payload: ${err}`)
      });
  }

  private getKey(): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      if (this.key) {
        return resolve(this.key);
      }
      return resolve(this.keyPromise);
    });
  }

  private encryptPayload(data: string): Promise<string> {
    return this.getKey()
      .then(key => {
        let nonce = randomBytes(24);
        let dataStr = JSON.stringify(data);
        let dataBytes = decodeUTF8(dataStr);

        let bytes = naclSecretbox(dataBytes, nonce, this.key);
        if (bytes === null) {
          throw new Error('Unable to encrypt data, probably an invalid key');
        }
        let encryptedData = encodeBase64(bytes);
        return `encrypted_data:${encodeBase64(nonce)}:${encryptedData}`;
      })
      .catch(err => {
        throw new Error('Unable to encrypt payload, no key');
      });
  }

  private decryptPayload(encryptedData: string): Promise<string> {
    return this.getKey()
      .then(key => {
        let minLength =
          naclSecretbox.overheadLength + naclSecretbox.nonceLength;
        if (encryptedData.length < minLength) {
          throw new Error(
            'encrypted payload too short',
          );
        }
        let parts = encryptedData.split(':');
        if (parts.length != 3) {
          throw new Error('unexpected data format');
        }

        let nonce = decodeBase64(parts[1]);
        let cipherText = decodeBase64(parts[2]);

        let bytes = naclSecretbox.open(cipherText, nonce, this.key);
        if (bytes === null) {
          throw new Error('probably invalid key');
        }
        let str = encodeUTF8(bytes);
        let decryptedData;
        try {
          decryptedData = JSON.parse(str);
        } catch (e) {}
        return decryptedData || str;
      })
      .catch(err => {
        throw new Error('no decryption key');
      });
  }

  private isEncryptedData(data: string): boolean {
    if (typeof data !== 'string') {
      return false;
    }
    return data.indexOf(this.encryptedDataPrefix) === 0;
  }
}
