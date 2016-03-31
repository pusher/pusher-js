import Factory from "../utils/factory";
import URLScheme from "./url_scheme";
import Socket from "../socket";

interface TransportHooks {
  file?: string;
  urls: URLScheme;
  handlesActivityChecks: boolean;
  supportsPing: boolean;
  isInitialized() : boolean;
  isSupported(environment?: any): boolean;
  getSocket(url : string, options?: any): Socket;
  beforeOpen?: Function;
}

export default TransportHooks;
