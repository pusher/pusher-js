import AbstractRuntime from './abstract_runtime';

interface AuthTransport {
  (context : AbstractRuntime, socketId : string, callback : Function) : void
}

interface AuthTransports {
  [index : string] : AuthTransport;
}


export {AuthTransport, AuthTransports};
