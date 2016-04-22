import {AuthTransports} from 'core/auth/auth_transports';
import TimelineSender from 'core/timeline/timeline_sender';
import TimelineTransport from 'core/timeline/timeline_transport';
import Ajax from 'core/http/ajax';
import {NetInfo} from 'net_info';
import TransportsTable from 'core/transports/transports_table';
import Socket from 'core/socket';

interface Runtime {
  whenReady(callback : Function) : void;
  getProtocol() : string;
  isXHRSupported() : boolean;
  isXDRSupported(encrypted?: boolean) : boolean;
  getGlobal() : any;
  getAuthorizers() : AuthTransports;
  getLocalStorage() : any;
  getClientFeatures() : any[];
  TimelineTransport: TimelineTransport;
  createXHR() : Ajax;
  createWebSocket(url : string) : Socket;
  getNetwork() : NetInfo;
  getDefaultStrategy(config : any) : any;
  Transports: TransportsTable;
  getWebSocketAPI() : new(url: string) => Socket;
  getXHRAPI() : new() => Ajax;
  addUnloadListener(listener : Function) : void;
  removeUnloadListener(listener : Function) : void;
  transportConnectionInitializer: Function;
}

export default Runtime;
