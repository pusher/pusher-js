import ConnectionManager from './connection/connection_manager';
import {AuthOptions} from './auth/options';

export interface ClientOptions {
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

export interface Client {
  config: ClientOptions;
  connection: ConnectionManager;
  send_event(event_name : string, data : any, channel?: string) : void;
}

export default Client;
