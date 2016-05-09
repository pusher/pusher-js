import ConnectionManager from './connection/connection_manager';
import {AuthOptions} from './auth/options';

interface PusherOptions {
  cluster: string;
  disableStats: boolean;
  statsHost: string;
  activity_timeout: number;
  pong_timeout: number;
  unavailable_timeout: number;
  encrypted: boolean;
  timelineParams: any;
  authTransport: "ajax" | "jsonp";
  auth: AuthOptions;
}

export default PusherOptions;
