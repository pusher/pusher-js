import Transport from './transport';

interface TransportsTable {
  ws: Transport;
  xhr_streaming: Transport;
  xdr_streaming?: Transport;
  xhr_polling: Transport;
  xdr_polling?: Transport;
  sockjs?: Transport;
}

export default TransportsTable;
