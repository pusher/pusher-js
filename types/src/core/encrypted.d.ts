import { default as BasePusher } from './pusher';
import { Options } from './options';
export default class Pusher extends BasePusher {
    constructor(app_key: string, options?: Options);
}
