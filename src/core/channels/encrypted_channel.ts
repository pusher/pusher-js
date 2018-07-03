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

/** Extends public channels to provide private channel interface.
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
export default class EncryptedChannel extends PrivateChannel {
  keyPromise: Promise<Uint8Array>;
  resolveKeyPromise: any;
  rejectKeyPromise: any;

  constructor(name: string, pusher: Pusher) {
    super(name, pusher);
    this.keyPromise = new Promise((resolve, reject) => {
      this.resolveKeyPromise = resolve;
      this.rejectKeyPromise = reject;
    });
    this.keyPromise.catch(err => {
      throw new Error(
        `Unable to retrieve encryption master key from auth endpoint: ${err}`
      );
    });
  }

  /** Authorizes the connection to use the channel.
   *
   * @param  {String} socketId
   * @param  {Function} callback
   */
  authorize(socketId: string, callback: Function) {
    super.authorize(socketId, (error, authData) => {
      let sharedSecret = authData["shared_secret"];
      if (!sharedSecret) {
        throw new Error(
          "No shared_secret key in auth payload for encrypted channel"
        );
      }
      this.resolveKeyPromise(decodeBase64(sharedSecret));
      delete authData["shared_secret"];
      callback(error, authData);
    });
  }

  /** Triggers an encrypted event */
  triggerEncrypted(event: string, data: any) {
    return this.encryptPayload(data).then(encryptedData => {
      return super.trigger(event, encryptedData);
    });
  }

  /** Handles an event. For internal use only.
   *
   * @param {String} event
   * @param {*} data
   */
  handleEvent(event: string, data: any) {
    return new Promise((resolve, reject) => {
      if (event.indexOf("pusher_internal:") === 0) {
        super.handleEvent(event, data);
        resolve();
      } else {
        this.decryptPayload(data)
          .then(decryptedData => {
            this.emit(event, decryptedData);
            resolve();
          })
          .catch(e => {
            reject(e);
          });
      }
    });
  }

  private encryptPayload(data: string): Promise<string | void> {
    return this.keyPromise
      .then(key => {
        let nonce = randomBytes(24);
        let dataStr = JSON.stringify(data);
        let dataBytes = decodeUTF8(dataStr);
        let bytes = secretbox(dataBytes, nonce, key);
        if (bytes === null) {
          throw new Error("Unable to encrypt data, probably an invalid key");
        }
        return {
          nonce: encodeBase64(nonce),
          ciphertext: encodeBase64(bytes)
        };
      })
      .catch(err => {
        throw new Error(`Unable to encrypt payload: ${err}`);
      });
  }

  private decryptPayload(encryptedData: string): Promise<string | void> {
    let baseErrMsg = "Unable to encrypt payload";
    return this.keyPromise
      .then(key => {
        if (!encryptedData["ciphertext"] || !encryptedData["nonce"]) {
          throw new Error(`${baseErrMsg}: unexpected data format`);
        }
        let nonce = decodeBase64(encryptedData["nonce"]);
        let cipherText = decodeBase64(encryptedData["ciphertext"]);
        if (
          nonce.length < secretbox.nonceLength ||
          cipherText.length < secretbox.overheadLength
        ) {
          throw new Error(`${baseErrMsg}: unexpected data format`);
        }
        let bytes = secretbox.open(cipherText, nonce, key);
        if (bytes === null) {
          throw new Error(`${baseErrMsg}: probably an invalid key`);
        }
        let str = encodeUTF8(bytes);
        let decryptedData;
        try {
          decryptedData = JSON.parse(str);
        } catch (e) {}
        return decryptedData || str;
      })
      .catch(err => {
        throw new Error(`${baseErrMsg}: ${err.message}`);
      });
  }
}
