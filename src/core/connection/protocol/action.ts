import Descriptions from "../handshake/handshake_results";

interface Action {
  action: Descriptions;
  id?: string;
  activityTimeout?: number;
  error?: any;
}

export default Action;
