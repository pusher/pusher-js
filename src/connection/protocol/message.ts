import InternalEvents from "./internal_events";

interface Message {
  event: string | InternalEvents;
  channel?: string;
  data?: any;
}

export default Message;
