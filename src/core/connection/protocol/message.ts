interface Message {
  event: string;
  channel?: string;
  data?: any;
  user_id?: string;
}

export default Message;
