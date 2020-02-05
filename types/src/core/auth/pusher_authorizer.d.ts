import Channel from '../channels/channel';
import { AuthTransports } from './auth_transports';
import { AuthOptions, AuthorizerOptions, Authorizer } from './options';
export default class PusherAuthorizer implements Authorizer {
    static authorizers: AuthTransports;
    channel: Channel;
    type: string;
    options: AuthorizerOptions;
    authOptions: AuthOptions;
    constructor(channel: Channel, options: AuthorizerOptions);
    composeQuery(socketId: string): string;
    authorize(socketId: string, callback: Function): any;
}
