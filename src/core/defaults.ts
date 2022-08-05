import {
  ChannelAuthorizationOptions,
  UserAuthenticationOptions
} from './auth/options';
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

var Defaults: DefaultConfig = {
  VERSION: VERSION,
  PROTOCOL: 7,

  wsPort: 80,
  wssPort: 443,
  wsPath: '',
  // DEPRECATED: SockJS fallback parameters
  httpHost: 'sockjs.pusher.com',
  httpPort: 80,
  httpsPort: 443,
  httpPath: '/pusher',
  // DEPRECATED: Stats
  stats_host: 'stats.pusher.com',
  // DEPRECATED: Other settings
  authEndpoint: '/pusher/auth',
  authTransport: 'ajax',
  activityTimeout: 120000,
  pongTimeout: 30000,
  unavailableTimeout: 10000,
  cluster: 'mt1',
  userAuthentication: {
    endpoint: '/pusher/user-auth',
    transport: 'ajax'
  },
  channelAuthorization: {
    endpoint: '/pusher/auth',
    transport: 'ajax'
  },

  // CDN configuration
  cdn_http: CDN_HTTP,
  cdn_https: CDN_HTTPS,
  dependency_suffix: DEPENDENCY_SUFFIX
};

export default Defaults;
