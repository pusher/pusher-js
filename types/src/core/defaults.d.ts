import { ChannelAuthorizationOptions, UserAuthenticationOptions } from './auth/options';
import { AuthTransport } from './config';
export interface DefaultConfig {
    VERSION: string;
    PROTOCOL: number;
    wsPort: number;
    wssPort: number;
    wsPath: string;
    httpHost: string;
    httpPort: number;
    httpsPort: number;
    httpPath: string;
    stats_host: string;
    authEndpoint: string;
    authTransport: AuthTransport;
    activityTimeout: number;
    pongTimeout: number;
    unavailableTimeout: number;
    cluster: string;
    userAuthentication: UserAuthenticationOptions;
    channelAuthorization: ChannelAuthorizationOptions;
    cdn_http?: string;
    cdn_https?: string;
    dependency_suffix?: string;
}
declare var Defaults: DefaultConfig;
export default Defaults;
