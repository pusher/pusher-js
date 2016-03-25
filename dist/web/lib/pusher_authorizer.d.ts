import Channel from './channels/channel';
export default class Authorizer {
    channel: Channel;
    type: string;
    options: any;
    authOptions: any;
    constructor(channel: Channel, options: any);
    composeQuery(socketId: string): string;
    authorize(socketId: string, callback: Function): any;
}
