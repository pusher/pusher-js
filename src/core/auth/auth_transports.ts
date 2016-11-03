import AbstractRuntime from 'runtimes/interface';
import Authorizer from './pusher_authorizer';

interface AuthTransport {
  (this: Authorizer, context : AbstractRuntime, socketId : string, callback : Function) : void
}

interface AuthTransports {
  [index : string] : AuthTransport;
}


export {AuthTransport, AuthTransports};
