import ConnectionManager from './connection/connection_manager';
import { AuthOptions, AuthorizerGenerator } from './auth/options';

export interface PusherOptions {
  cluster: string;
  disableStats: boolean;
  enableStats: boolean;
  statsHost: string;
  activity_timeout: number;
  pong_timeout: number;
  unavailable_timeout: number;
  forceTLS: boolean;
  encrypted: boolean;
  timelineParams: any;
  authTransport: 'ajax' | 'jsonp';
  auth: AuthOptions;
  authorizer: AuthorizerGenerator;
}

type Transport = 'ws' | 'wss' | 'xhr_streaming' | 'xhr_polling' | 'sockjs';
type AuthTransport = 'ajax' | 'jsonp';

export interface Options {
  activityTimeout?: number;
  enableStats?: boolean;
  disableStats?: boolean; // deprecated
  authEndpoint?: string;
  auth?: AuthOptions;
  authTransport?: AuthTransport;
  authorizer?: AuthorizerGenerator;
  disabledTransports?: Transport[];
  enabledTransports?: Transport[];
  encrypted?: boolean;
  forceTLS?: boolean;
  ignoreNullOrigin?: boolean;
  pongTimeout?: number;
  statsHost?: string;
  timelineParams?: any;
  unavailable_timeout?: number;
  cluster?: string;
  wsHost?: string;
  httpHost?: string;
  wsPath?: string;
  wsPort?: number;
  wssPort?: number;
  httpPort?: number;
  httpsPort?: number;
}
