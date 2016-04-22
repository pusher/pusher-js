import TransportConnection from "../../transports/transport_connection";
import Action from "../protocol/action";
import Connection from "../connection";

interface HandshakePayload {
  transport: TransportConnection;
  action: Action;
  connection?: Connection;
  activityTimeout?: number;
  error: any;
}

export default HandshakePayload;
