import Factory from "../utils/factory";
import PrivateChannel from './private_channel';
import Pusher from '../pusher';
import * as Errors from '../errors';

import { secretbox as naclSecretbox, randomBytes } from 'tweetnacl'
import {
  encodeUTF8,
  decodeBase64,
  encodeBase64,
  decodeUTF8
} from 'tweetnacl-util'

/** Extends public channels to provide private channel interface.
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
export default class EncryptedChannel extends PrivateChannel {
  key: Uint8Array;
  encryptedDataPrefix :string;

  constructor(name: string, pusher: Pusher){
    super(name, pusher)
    this.encryptedDataPrefix = 'encrypted_data';
  }

  /** Authorizes the connection to use the channel.
   *
   * @param  {String} socketId
   * @param  {Function} callback
   */
  authorize(socketId : string, callback : Function) {
    super.authorize(socketId, (error, authData) => {
      let { auth, shared_secret} = authData;
      if(shared_secret){
        this.key  = this.convertBase64(shared_secret)
      } else {
        throw new Error('Unable to extract shared secret from auth payload');
      }
      callback(error, {auth});
    });

  }

  /** Triggers an event */
  trigger(event : string, data : any) {
    let encryptedData = this.encryptPayload(data);
    return super.trigger(event, encryptedData)
  }

  /** Handles an event. For internal use only.
   *
   * @param {String} event
   * @param {*} data
   */
  handleEvent(event : string, data : any) {
    if (!this.isEncryptedData(data)) {
      return super.handleEvent(event, data)
    }
    var decryptedData = this.decryptPayload(data)
    this.emit(event, decryptedData);
  }

  private encryptPayload(data: string): string {
    if(!this.key) {
      throw new Error('Unable to encrypt payload, no key');
    }
    let nonce = randomBytes(24);
    let dataStr = JSON.stringify(data);
    let dataBytes = decodeUTF8(dataStr);

    let bytes = naclSecretbox(dataBytes, nonce, this.key);
    if(bytes === null) {
      throw new Error("Unable to encrypt data, probably an invalid key");
    }
    let encryptedData = encodeBase64(bytes)
    return `encrypted_data:${encodeBase64(nonce)}:${encryptedData}`
  }

  private decryptPayload(encryptedData: string) {
    if(!this.key) {
      throw new Error('Unable to decrypt payload, no decryption key');
    }
    let minLength = naclSecretbox.overheadLength + naclSecretbox.nonceLength;
    if (encryptedData.length < minLength) {
      throw new Error('Unable to decrypt payload, encrypted payload too short');
    }
    let parts = encryptedData.split(':');
    if (parts.length != 3 ) {
      throw new Error('Unable to decrypt payload, unexpected data format');
    }

    let nonce = this.convertBase64(parts[1]);
    let cipherText = this.convertBase64(parts[2]);

    let bytes = naclSecretbox.open(cipherText, nonce, this.key);
    if(bytes === null) {
      throw new Error("Unable to decrypt payload, probably an invalid key");
    }
    let str = encodeUTF8(bytes)
    let decryptedData;
    try {
      decryptedData = JSON.parse(str);
    } catch(e) {
    }
    return decryptedData || str
  }

  private convertBase64(b: string): Uint8Array {
    return decodeBase64(b)
  }

  private isEncryptedData(data: string): boolean {
    if (typeof(data) !== 'string') {
      return false
    }
    return data.indexOf(this.encryptedDataPrefix) === 0
  }
}
