export interface ChannelAuthorizationData {
    auth: string;
    channel_data?: string;
    shared_secret?: string;
}
export declare type ChannelAuthorizationCallback = (error: Error | null, authData: ChannelAuthorizationData | null) => void;
export interface ChannelAuthorizationRequestParams {
    socketId: string;
    channelName: string;
}
export interface ChannelAuthorizationHandler {
    (params: ChannelAuthorizationRequestParams, callback: ChannelAuthorizationCallback): void;
}
export interface UserAuthenticationData {
    auth: string;
    user_data: string;
}
export declare type UserAuthenticationCallback = (error: Error | null, authData: UserAuthenticationData | null) => void;
export interface UserAuthenticationRequestParams {
    socketId: string;
}
export interface UserAuthenticationHandler {
    (params: UserAuthenticationRequestParams, callback: UserAuthenticationCallback): void;
}
export declare type AuthTransportCallback = ChannelAuthorizationCallback | UserAuthenticationCallback;
export interface AuthOptions<AuthHandler> {
    transport: 'ajax' | 'jsonp';
    endpoint: string;
    params?: any;
    headers?: any;
    customHandler?: AuthHandler;
}
export interface InternalAuthOptions {
    transport: 'ajax' | 'jsonp';
    endpoint: string;
    params?: any;
    headers?: any;
}
