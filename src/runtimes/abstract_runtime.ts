abstract class Runtime {
  abstract whenReady(callback : Function) : void;
  abstract getProtocol() : string;
  abstract isXHRSupported() : boolean;
  abstract isXDRSupported(encrypted?: boolean) : boolean;
  abstract getDocument() : any;
}

export default Runtime;
