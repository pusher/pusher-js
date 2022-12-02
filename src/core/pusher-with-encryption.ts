import Pusher from './pusher';
import { Options, validateOptions } from './options';
import * as nacl from 'tweetnacl';

export default class PusherWithEncryption extends Pusher {
  constructor(app_key: string, options: Options) {
    Pusher.logToConsole = PusherWithEncryption.logToConsole;
    Pusher.log = PusherWithEncryption.log;

    validateOptions(options);
    options.nacl = nacl;
    super(app_key, options);
  }
}
