import Channel from '../channels/channel';
import { AuthorizerCallback, AuthHandler, NewAuthOptions } from './options';
export interface ChannelAuthorizer {
    authorize(socketId: string, callback: AuthorizerCallback): void;
}
export interface ChannelAuthorizerGenerator {
    (channel: Channel, options: OldAuthorizerOptions): ChannelAuthorizer;
}
export interface OldAuthOptions {
    params?: any;
    headers?: any;
}
export interface OldAuthorizerOptions {
    authTransport: 'ajax' | 'jsonp';
    authEndpoint: string;
    auth?: OldAuthOptions;
}
export declare const ChannelAuthorizerProxy: (pusher: any, channelAuth: NewAuthOptions, channelAuthorizerGenerator: ChannelAuthorizerGenerator) => AuthHandler;
