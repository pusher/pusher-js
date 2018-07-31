import Factory from "../utils/factory";
import PrivateChannel from "./private_channel";
import Pusher from "../pusher";
import * as Errors from "../errors";
import { secretbox, randomBytes } from "tweetnacl";
import {
  encodeUTF8,
  decodeBase64,
  encodeBase64,
  decodeUTF8
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

  /** Authorizes the connection to use the channel.
   *
   * @param  {String} socketId
   * @param  {Function} callback
   */
  authorize(socketId: string, callback: Function) {
    super.authorize(socketId, (error, authData) => {
      let sharedSecret = authData["shared_secret"];
      if (!sharedSecret) {
        callback(true, `No shared_secret key in auth payload for encrypted channel: ${this.name}`);
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
    if (event.indexOf("pusher_internal:") === 0) {
      super.handleEvent(event, data);
      return
    }
    if(!this.key) return
    let decryptedData = this.decryptPayload(data)
    this.emit(event, decryptedData);
  }

  private decryptPayload(encryptedData: EncryptedMessage): string {
    let baseErrMsg = "Unable to decrypt payload";
    if (!encryptedData.ciphertext || !encryptedData.nonce) {
      throw new Errors.EncryptionError(`${baseErrMsg}: unexpected data format`);
    }
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
      throw new Errors.EncryptionError(`${baseErrMsg}: probably an invalid key`);
    }
    let str = encodeUTF8(bytes);
    try {
      return JSON.parse(str)
    } catch (e) {
      return str
    }
  }
}
