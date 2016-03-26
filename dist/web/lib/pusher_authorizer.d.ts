import Channel from './channels/channel';
export default class Authorizer {
    static authorizers: {
        ajax: (socketId: any, callback: any) => any;
    };
    channel: Channel;
    type: string;
    options: any;
    authOptions: any;
    constructor(channel: Channel, options: any);
    composeQuery(socketId: string): string;
    authorize(socketId: string, callback: Function): any;
}
