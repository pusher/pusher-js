interface Ajax {
  open(method : string, url : string, async : boolean) : Function;
  send(payload?: any) : Function;
  onreadystatechange : Function;
  readyState : number;
  responseText: string;

  ontimeout: Function;
  onerror: Function;
  onprogress: Function;
  onload: Function;
  abort: Function;
}

export default Ajax;
