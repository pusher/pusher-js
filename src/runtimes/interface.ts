import {AuthTransports} from 'core/auth/auth_transports';
import TimelineSender from 'core/timeline/timeline_sender';
import TimelineTransport from 'core/timeline/timeline_transport';
import Ajax from 'core/http/ajax';
import Reachability from 'core/reachability';
import TransportsTable from 'core/transports/transports_table';
import Socket from 'core/socket';
import HTTPFactory from 'core/http/http_factory';
import HTTPRequest from 'core/http/http_request';
import Pusher from 'core/pusher';

interface Runtime {
  setup(PusherClass : {
    new (key: string, options: any) : Pusher;
    ready() : void;
  }) : void;
  getProtocol() : string;
  getGlobal() : any;
  getAuthorizers() : AuthTransports;
  getLocalStorage() : any;
  TimelineTransport: TimelineTransport;
  createXHR() : Ajax;
  createWebSocket(url : string) : Socket;
  getNetwork() : Reachability;
  getDefaultStrategy(config : any) : any;
  Transports: TransportsTable;
  getWebSocketAPI() : new(url: string) => Socket;
  getXHRAPI() : new() => Ajax;
  addUnloadListener(listener : Function) : void;
  removeUnloadListener(listener : Function) : void;
  transportConnectionInitializer: Function;
  HTTPFactory: HTTPFactory;
  isXHRSupported() : boolean;
  createSocketRequest(method : string, url : string) : HTTPRequest;
}

export default Runtime;
