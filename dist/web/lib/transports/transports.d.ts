import Transport from "./transport.ts";
declare var Transports: {
    WSTransport: Transport;
    SockJSTransport: Transport;
    XHRStreamingTransport: Transport;
    XDRStreamingTransport: Transport;
    XHRPollingTransport: Transport;
    XDRPollingTransport: Transport;
};
export default Transports;
