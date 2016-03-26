import Channel from './channels/channel';
import Factory from './utils/factory';
export default class Authorizer {
    static authorizers: {
        ajax: (socketId: any, callback: any) => any;
    };
    factory: Factory;
    channel: Channel;
    type: string;
    options: any;
    authOptions: any;
    constructor(factory: Factory, channel: Channel, options: any);
    composeQuery(socketId: string): string;
    authorize(socketId: string, callback: Function): any;
}
