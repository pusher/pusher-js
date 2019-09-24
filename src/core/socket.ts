interface Socket {
  send(payload: any): void;
  ping?(): void;
  close(code?: any, reason?: any);
  sendRaw?(payload: any): boolean;

  onopen?(evt?: any): void;
  onerror?(error: any): void;
  onclose?(closeEvent: any): void;
  onmessage?(message: any): void;
  onactivity?(): void;
}

export default Socket;
