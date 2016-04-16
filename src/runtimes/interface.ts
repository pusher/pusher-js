import {AuthTransports} from 'core/auth/auth_transports';
import TimelineSender from 'core/timeline/timeline_sender';
import TimelineTransport from 'core/timeline/timeline_transport';
import Ajax from 'core/http/ajax';
import {NetInfo} from 'net_info';

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
  createWebSocket(url : string) : any;
  getNetwork() : NetInfo;
  getDefaultStrategy(config : any) : any;
}

export default Runtime;
