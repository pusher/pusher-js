import PrivateChannel from "./private_channel";
import * as Errors from "../errors";
import Logger from '../logger'
import { secretbox } from "tweetnacl";
import {
  encodeUTF8,
  decodeBase64
} from "tweetnacl-util";

type EncryptedMessage = {
  nonce: string;
  ciphertext: string;
}

/** Extends private channels to provide encrypted channel interface.
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
export default class EncryptedChannel extends PrivateChannel {
  key: Uint8Array = null;
  retries: number = 1;

  /** Authorizes the connection to use the channel.
   *
   * @param  {String} socketId
   * @param  {Function} callback
   */
  authorize(socketId: string, callback: Function) {
    super.authorize(socketId, (error, authData) => {
      let sharedSecret = authData["shared_secret"];
      if (!sharedSecret) {
        let errorMsg = `No shared_secret key in auth payload for encrypted channel: ${this.name}`;
        callback(true, errorMsg);
        Logger.warn(`Error: ${errorMsg}`);
        return
      }
      this.key = decodeBase64(sharedSecret);
      delete authData["shared_secret"];
      callback(error, authData);
    });
  }

  trigger(event: string, data: any): boolean {
    throw new Errors.UnsupportedFeature(
      'Client events are not currently supported for encrypted channels'
    );
  }

  /** Handles an event. For internal use only.
   *
   * @param {String} event
   * @param {*} data
   */
  handleEvent(event: string, data: any) {
    if (event.indexOf("pusher_internal:") === 0 || event.indexOf("pusher:") === 0) {
      super.handleEvent(event, data);
      return
    }
    this.handleEncryptedEvent(event, data)
  }

  private handleEncryptedEvent(event: string, data: any): void {
    if(!this.key) return
    if (!data.ciphertext || !data.nonce) {
      throw new Errors.EncryptionError('Unexpected data format for encrypted message');
    }
    let encryptedData = (data as EncryptedMessage);
    try {
      let decryptedData = this.decryptPayload(encryptedData)
      this.retries = 1;
      this.emit(event, decryptedData);
    }
    catch(e) {
      if(e instanceof Errors.EncryptionKeyError) {
        if(this.retries === 0) {
          Logger.warn("Decryption error after successful re-auth, unsubscribing");
          this.unsubscribe()
          return
        }
        //need to reauth
        this.authorize(this.pusher.connection.socket_id, (error, authData) => {
          if(error) {
            throw new Error("Reauth failed")
          }
          this.retries--;
          this.handleEncryptedEvent(event, data)
        });
      }
    }
  }

  private decryptPayload(encryptedData: EncryptedMessage): string {
    let baseErrMsg = "Unable to decrypt payload";
    let nonce = decodeBase64(encryptedData.nonce);
    let cipherText = decodeBase64(encryptedData.ciphertext);
    if (
      nonce.length < secretbox.nonceLength ||
      cipherText.length < secretbox.overheadLength
    ) {
      throw new Errors.EncryptionError(`${baseErrMsg}: unexpected data format`);
    }
    let bytes = secretbox.open(cipherText, nonce, this.key);
    if (bytes === null) {
      throw new Errors.EncryptionKeyError(baseErrMsg);
    }
    let str = encodeUTF8(bytes);
    try {
      return JSON.parse(str)
    } catch (e) {
      return str
    }
  }
}
