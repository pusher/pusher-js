import ConnectionManager from './connection/connection_manager';
import {AuthOptions, AuthorizerGenerator} from './auth/options';

interface PusherOptions {
  cluster: string;
  disableStats: boolean;
  statsHost: string;
  activity_timeout: number;
  pong_timeout: number;
  unavailable_timeout: number;
  forceTLS: boolean;
  encrypted: boolean;
  timelineParams: any;
  authTransport: "ajax" | "jsonp";
  auth: AuthOptions;
  authorizer: AuthorizerGenerator;
}

export default PusherOptions;
