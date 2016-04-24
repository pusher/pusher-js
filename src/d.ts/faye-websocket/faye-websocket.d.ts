declare module "faye-websocket" {
  interface MessageEvent {
    data: any;
  }

  interface CloseEvent {
    code: number;
    reason: string;
    wasClean: boolean;
  }

  export class Client {
    public onopen: () => void;
    public onmessage: (event: MessageEvent) => void;
    public onclose: (event: CloseEvent) => void;

    constructor(url: string);
    send(data: string): void;
    close(code?: number, reason?: string): void;
  }
}