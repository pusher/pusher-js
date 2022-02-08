import { Options } from './options';
import { AuthHandler } from './auth/options';
import * as nacl from 'tweetnacl';
export declare type AuthTransport = 'ajax' | 'jsonp';
export declare type Transport = 'ws' | 'wss' | 'xhr_streaming' | 'xhr_polling' | 'sockjs';
export interface Config {
    activityTimeout: number;
    enableStats: boolean;
    httpHost: string;
    httpPath: string;
    httpPort: number;
    httpsPort: number;
    pongTimeout: number;
    statsHost: string;
    unavailableTimeout: number;
    useTLS: boolean;
    wsHost: string;
    wsPath: string;
    wsPort: number;
    wssPort: number;
    userAuthenticator: AuthHandler;
    channelAuthorizer: AuthHandler;
    forceTLS?: boolean;
    cluster?: string;
    disabledTransports?: Transport[];
    enabledTransports?: Transport[];
    ignoreNullOrigin?: boolean;
    nacl?: nacl;
    timelineParams?: any;
}
export declare function getConfig(opts: Options, pusher: any): Config;
