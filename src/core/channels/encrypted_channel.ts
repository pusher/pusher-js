import Factory from "../utils/factory";
import PrivateChannel from './private_channel';
import Pusher from '../pusher';
import * as _sodium from 'libsodium-wrappers'

/** Extends public channels to provide private channel interface.
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
export default class EncryptedChannel extends PrivateChannel {
  key: string;
  sodium: any;
  encryptedDataPrefix :string;

  constructor(name: string, pusher: Pusher){
    super(name, pusher)
    this.encryptedDataPrefix = 'encrypted_data';
    _sodium.ready.then(() => {
      this.sodium = _sodium;
    });
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
    if(!this.sodium) {
      throw new Error('Unable to decrypt payload, sodium not initalized')
    }
    let minLength = this.sodium.crypto_secretbox_NONCEBYTES + this.sodium.crypto_secretbox_MACBYTES;
    if (encryptedData.length < minLength) {
      throw new Error('Unable to decrypt payload, encrypted payload too short')
    }
    let parts = encryptedData.split(':')
    if (parts.length != 3 ) {
      throw new Error('Unable to decrypt payload, unexpected data format')
    }

    let nonce = this.convertBase64(parts[1])
    let cipherText = this.convertBase64(parts[2])

    let bytes = this.sodium.crypto_secretbox_open_easy(cipherText, nonce, this.key);
    let str = this.sodium.to_string(bytes);
    let decryptedData;
    try {
      decryptedData = JSON.parse(str);
    } catch(e) {
      throw new Error(`Unable to parse decrypted payload: ${e}`)
    }
    return decryptedData
  }

  private extractAndAttachKey(authEndpointResponse: any): void {
    let decodedKey = this.convertBase64(authEndpointResponse['shared-secret'])
    this.key = decodedKey;
  }
  private convertBase64(b: string): string {
    return this.sodium.from_base64(b, this.sodium.base64_variants.ORIGINAL)
  }

  private isEncryptedData(data: string): boolean {
    if (typeof(data) !== 'string') {
      return false
    }
    return data.indexOf(this.encryptedDataPrefix) === 0
  }
}



