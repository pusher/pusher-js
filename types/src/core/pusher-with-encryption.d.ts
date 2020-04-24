import Pusher from './pusher';
import { Options } from './options';
export default class PusherWithEncryption extends Pusher {
    constructor(app_key: string, options?: Options);
}
