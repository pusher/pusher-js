import ConnectionManager from './connection/connection_manager';
import { AuthOptions, AuthorizerGenerator } from './auth/options';
import { AuthTransport, Transport } from './config';
import * as nacl from 'tweetnacl';

export interface Options {
  activityTimeout?: number;
  auth?: AuthOptions;
  authEndpoint?: string;
  authTransport?: AuthTransport;
  authorizer?: AuthorizerGenerator;
  cluster?: string;
  enableStats?: boolean;
  disableStats?: boolean;
  disabledTransports?: Transport[];
  enabledTransports?: Transport[];
  forceTLS?: boolean;
  httpHost?: string;
  httpPath?: string;
  httpPort?: number;
  httpsPort?: number;
  ignoreNullOrigin?: boolean;
  nacl?: nacl;
  pongTimeout?: number;
  statsHost?: string;
  timelineParams?: any;
  unavailableTimeout?: number;
  wsHost?: string;
  wsPath?: string;
  wsPort?: number;
  wssPort?: number;
}
