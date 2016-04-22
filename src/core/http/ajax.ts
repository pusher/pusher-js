interface Ajax {
  open(method : string, url : string, async?: boolean, user?: string, password?: string) : void;
  send(payload?: any) : void;
  onreadystatechange : Function;
  readyState : number;
  responseText: string;
  status: number;

  ontimeout: Function;
  onerror: Function;
  onprogress: Function;
  onload: Function;
  abort: Function;
}

export default Ajax;
