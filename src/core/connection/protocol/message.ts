interface Message {
  event: string;
  channel?: string;
  data?: any;
}

export default Message;
