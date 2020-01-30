interface Ajax {
  open(
    method: string,
    url: string,
    async?: boolean,
    user?: string,
    password?: string
  ): void;
  send(payload?: any): void;
  setRequestHeader(key: string, value: string): void;
  onreadystatechange: Function;
  readyState: number;
  responseText: string;
  status: number;
  withCredentials?: boolean;

  ontimeout: Function;
  onerror: Function;
  onprogress: Function;
  onload: Function;
  abort: Function;
}

export default Ajax;
