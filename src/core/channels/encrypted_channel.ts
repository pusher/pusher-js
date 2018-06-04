import Factory from "../utils/factory";
import PrivateChannel from './private_channel';
import Pusher from '../pusher';
import * as nacl from 'tweetnacl'
import * as naclUtil from 'tweetnacl-util'

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
      if(authData['shared-secret']){
        this.extractAndAttachKey(authData)
        delete authData['shared-secret'];
      }
      callback(error, authData)
    });

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

  private decryptPayload(encryptedData: string) {
    let minLength = nacl.secretbox.overheadLength + nacl.secretbox.nonceLength;
    if (encryptedData.length < minLength) {
      throw new Error('Unable to decrypt payload, encrypted payload too short')
    }
    let parts = encryptedData.split(':')
    if (parts.length != 3 ) {
      throw new Error('Unable to decrypt payload, unexpected data format')
    }

    let nonce = this.convertBase64(parts[1])
    let cipherText = this.convertBase64(parts[2])

    let bytes = nacl.secretbox.open(cipherText, nonce, this.key);
    let str = naclUtil.encodeUTF8(bytes)
    let decryptedData;
    try {
      decryptedData = JSON.parse(str);
    } catch(e) {
    }
    return decryptedData || str
  }

  private extractAndAttachKey(authEndpointResponse: any): void {
    let decodedKey = this.convertBase64(authEndpointResponse['shared-secret'])
    this.key = decodedKey;
  }
  private convertBase64(b: string): Uint8Array {
    return naclUtil.decodeBase64(b)
  }

  private isEncryptedData(data: string): boolean {
    if (typeof(data) !== 'string') {
      return false
    }
    return data.indexOf(this.encryptedDataPrefix) === 0
  }
}

