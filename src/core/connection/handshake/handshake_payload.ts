import TransportConnection from "../../transports/transport_connection";
import Action from "../protocol/action";
import Connection from "../connection";

interface HandshakePayload extends Action {
  transport: TransportConnection;
  connection?: Connection;
}

export default HandshakePayload;
