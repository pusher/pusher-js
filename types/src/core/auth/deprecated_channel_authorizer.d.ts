import Channel from '../channels/channel';
import { ChannelAuthorizationCallback, ChannelAuthorizationHandler, InternalAuthOptions } from './options';
export interface DeprecatedChannelAuthorizer {
    authorize(socketId: string, callback: ChannelAuthorizationCallback): void;
}
export interface ChannelAuthorizerGenerator {
    (channel: Channel, options: DeprecatedAuthorizerOptions): DeprecatedChannelAuthorizer;
}
export interface DeprecatedAuthOptions {
    params?: any;
    headers?: any;
}
export interface DeprecatedAuthorizerOptions {
    authTransport: 'ajax' | 'jsonp';
    authEndpoint: string;
    auth?: DeprecatedAuthOptions;
}
export declare const ChannelAuthorizerProxy: (pusher: any, authOptions: InternalAuthOptions, channelAuthorizerGenerator: ChannelAuthorizerGenerator) => ChannelAuthorizationHandler;
