import Transport from "core/transports//transport";
declare var Transports: {
    ws: Transport;
    xhr_streaming: Transport;
    xdr_streaming: Transport;
    xhr_polling: Transport;
    xdr_polling: Transport;
};
export default Transports;
