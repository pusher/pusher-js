import Transport from "core/transports//transport";
declare var Transports: {
    WSTransport: Transport;
    XHRStreamingTransport: Transport;
    XDRStreamingTransport: Transport;
    XHRPollingTransport: Transport;
    XDRPollingTransport: Transport;
};
export default Transports;
