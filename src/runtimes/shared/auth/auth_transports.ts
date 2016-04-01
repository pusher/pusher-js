import AbstractRuntime from '../runtime_interface';

interface AuthTransport {
  (context : AbstractRuntime, socketId : string, callback : Function) : void
}

interface AuthTransports {
  [index : string] : AuthTransport;
}


export {AuthTransport, AuthTransports};
