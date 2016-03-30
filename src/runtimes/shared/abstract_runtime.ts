import {AuthTransports} from 'shared/auth_transports';
import TimelineSender from '../../timeline/timeline_sender';
import TimelineTransport from 'shared/timeline_transport';

interface Runtime {
  whenReady(callback : Function) : void;
  getProtocol() : string;
  isXHRSupported() : boolean;
  isXDRSupported(encrypted?: boolean) : boolean;
  isSockJSSupported() : boolean;
  getDocument() : any;
  getGlobal() : any;
  getAuthorizers() : AuthTransports;
  getTimelineTransport(sender : TimelineSender, encrypted : boolean): TimelineTransport;
  getLocalStorage() : any;
  getClientFeatures() : any[];
}

export default Runtime;
