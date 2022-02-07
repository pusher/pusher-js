import Channel from '../channels/channel';
import { AuthorizerCallback, AuthHandler, InternalAuthOptions } from './options';
export interface OldChannelAuthorizer {
    authorize(socketId: string, callback: AuthorizerCallback): void;
}
export interface ChannelAuthorizerGenerator {
    (channel: Channel, options: OldAuthorizerOptions): OldChannelAuthorizer;
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
export declare const ChannelAuthorizerProxy: (pusher: any, authOptions: InternalAuthOptions, channelAuthorizerGenerator: ChannelAuthorizerGenerator) => AuthHandler;
