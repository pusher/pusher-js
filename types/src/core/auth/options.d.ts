import Channel from '../channels/channel';
export interface AuthOptions {
    params?: any;
    headers?: any;
}
export interface AuthData {
    auth: string;
    channel_data?: string;
    shared_secret?: string;
}
export declare type AuthorizerCallback = (error: Error | null, authData: AuthData) => void;
export interface Authorizer {
    authorize(socketId: string, callback: AuthorizerCallback): void;
}
export interface AuthorizerGenerator {
    (channel: Channel, options: AuthorizerOptions): Authorizer;
}
export interface AuthorizerOptions {
    authTransport: 'ajax' | 'jsonp';
    auth?: AuthOptions;
    authorizer?: AuthorizerGenerator;
}
