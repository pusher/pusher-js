import Channel from './channels/channel';
import { AuthTransports } from 'shared/auth_transports';
export default class Authorizer {
    static authorizers: AuthTransports;
    channel: Channel;
    type: string;
    options: any;
    authOptions: any;
    constructor(channel: Channel, options: any);
    composeQuery(socketId: string): string;
    authorize(socketId: string, callback: Function): any;
}
