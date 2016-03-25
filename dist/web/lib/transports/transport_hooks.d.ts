import URLScheme from "./url_scheme.ts";
import Socket from "./socket.ts";
interface TransportHooks {
    file?: string;
    urls: URLScheme;
    handlesActivityChecks: boolean;
    supportsPing: boolean;
    isInitialized(): boolean;
    isSupported(Object: any): boolean;
    getSocket(string: any): Socket;
}
export default TransportHooks;
