import {AuthTransports} from 'shared/auth/auth_transports';
import TimelineSender from 'core/timeline/timeline_sender';
import TimelineTransport from 'shared/timeline/timeline_transport';

interface Runtime {
  whenReady(callback : Function) : void;
  getProtocol() : string;
  isXHRSupported() : boolean;
  isXDRSupported(encrypted?: boolean) : boolean;
  isSockJSSupported() : boolean;
  getDocument() : any;
  getGlobal() : any;
  getAuthorizers() : AuthTransports;
  getLocalStorage() : any;
  getClientFeatures() : any[];
  TimelineTransport: TimelineTransport;
}

export default Runtime;
