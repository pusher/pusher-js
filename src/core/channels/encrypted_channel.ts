import Factory from "../utils/factory";
import PrivateChannel from "./private_channel";
import Pusher from "../pusher";
import * as Errors from "../errors";
import Logger from '../logger'
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

type EncryptedEvent = {
  data: EncryptedMessage,
  event: string,
}

enum State {
  Authorized,
  AuthorizationPending,
  NotAuthorized,
}

/** Extends private channels to provide encrypted channel interface.
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
export default class EncryptedChannel extends PrivateChannel {
  key: Uint8Array = null;
  state: State = State.NotAuthorized;
  buffer: Array<EncryptedEvent> = [];
  retries: number = 0;

  /** Authorizes the connection to use the channel.
   *
   * @param  {String} socketId
   * @param  {Function} callback
   */
  authorize(socketId: string, callback: Function) {
    this.setState(State.AuthorizationPending)
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
      this.setState(State.Authorized)
    });
  }

  private retryAuth(delay: number = 0): void {
    this.setState(State.AuthorizationPending);
    // we should already have a socket_id at this point
    this.authorize(this.pusher.connection.socket_id, (error, authData) => {
      if(error) {
        this.retries++
        let retryDelay = Math.pow(2, this.retries)
        this.retryAuth(delay)
      }
    });
  }

  trigger(event: string, data: any) {
    if(!this.key) return false;
    let encryptedData = this.encryptPayload(data);
    return super.trigger(event, encryptedData);
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
    switch(this.state) {
      case State.AuthorizationPending:
        console.log("received event while auth pending, buffering")
        this.bufferEvent({event, data})
      case State.Authorized:
        console.log("received event while authed, decrypting")
        this.handleEncryptedEvent({event, data})
      case State.NotAuthorized:
        // Drop the message if we're not authorized or trying to authorize
    }
  }
  private handleEncryptedEvent(encryptedEvent: EncryptedEvent): void {
    try {
      let decryptedData = this.decryptPayload(encryptedEvent.data)
      this.emit(encryptedEvent.event, decryptedData);
      if(this.retries !== 0) {
        console.log("Successfully decrypted, resetting retries");
        this.retries = 0;
      }
    }
    catch(e) {
      if(e instanceof Errors.EncryptionKeyError) {
        console.log("Got encryption key error, retrying auth");
        this.retryAuth();
      }
    }
  }

  private bufferEvent(encryptedEvent: EncryptedEvent): void {
    this.buffer.push(encryptedEvent);
  }

  private drainBuffer(): void {
    let last = this.buffer.length - 1;
    for(let i = last; i > 0; i--) {
      this.handleEncryptedEvent(this.buffer[i])
      this.buffer.pop()
    }
  }

  private setState(state: State): void {
    console.log(`State transition from ${this.state} -> ${state}`);
    // should we whether the state transform is valid?
    // maybe have pre state and poststate transition methods?
    switch(state) {
      case State.NotAuthorized:
      case State.AuthorizationPending:
        // new events should now go into the buffer
      case State.Authorized:
        console.log('draining buffer');
        this.drainBuffer()
    }
    this.state = state;
  }

  private encryptPayload(data: string): EncryptedMessage {
    let baseErrMsg = "Unable to encrypt payload";
    let nonce = randomBytes(24);
    let dataStr = JSON.stringify(data);
    let dataBytes = decodeUTF8(dataStr);
    let bytes = secretbox(dataBytes, nonce, this.key);
    if (bytes === null) {
      throw new Errors.EncryptionError(`${baseErrMsg}: probably an invalid key`);
    }
    return {
      nonce: encodeBase64(nonce),
      ciphertext: encodeBase64(bytes)
    };
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
      throw new Errors.EncryptionKeyError(`${baseErrMsg}: probably an invalid key`);
    }
    let str = encodeUTF8(bytes);
    try {
      return JSON.parse(str)
    } catch (e) {
      return str
    }
  }
}

const delay = (seconds: number): Promise<any> => (
  new Promise((resolve) => setTimeout(resolve, seconds * 1000))
);
