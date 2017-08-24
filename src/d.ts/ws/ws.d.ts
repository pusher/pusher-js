// Type definitions for ws
// Project: https://github.com/einaros/ws
// Definitions by: Paul Loyd <https://github.com/loyd>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
/* 
declare module "ws" {

    class WebSocket  {
        static CONNECTING: number;
        static OPEN: number;
        static CLOSING: number;
        static CLOSED: number;

        bytesReceived: number;
        readyState: number;
        protocolVersion: string;
        url: string;
        supports: any;

        CONNECTING: number;
        OPEN: number;
        CLOSING: number;
        CLOSED: number;

        onopen: (event: {target: WebSocket}) => void;
        onerror: (err: Error) => void;
        onclose: (event: {wasClean: boolean; code: number; reason: string; target: WebSocket}) => void;
        onmessage: (event: {data: any; type: string; target: WebSocket}) => void;

        constructor(address: string, options?: {
            protocol?: string;
            headers?: {[key: string]: string};
            protocolVersion?: any;
            host?: string;
            origin?: string;
            pfx?: any;
            key?: any;
            passphrase?: string;
            cert?: any;
            ca?: any[];
            ciphers?: string;
            rejectUnauthorized?: boolean;
        });

        close(code?: number, data?: any): void;
        pause(): void;
        resume(): void;
        ping(data?: any, options?: {mask?: boolean; binary?: boolean}, dontFail?: boolean): void;
        pong(data?: any, options?: {mask?: boolean; binary?: boolean}, dontFail?: boolean): void;
        send(data: any, cb?: (err: Error) => void): void;
        send(data: any, options: {mask?: boolean; binary?: boolean}, cb?: (err: Error) => void): void;
        stream(options: {mask?: boolean; binary?: boolean}, cb?: (err: Error, final: boolean) => void): void;
        stream(cb?: (err: Error, final: boolean) => void): void;
        terminate(): void;

        // HTML5 WebSocket events
        addEventListener(method: 'message', cb?: (event: {data: any; type: string; target: WebSocket}) => void): void;
        addEventListener(method: 'close', cb?: (event: {wasClean: boolean; code: number;
                                                        reason: string; target: WebSocket}) => void): void;
        addEventListener(method: 'error', cb?: (err: Error) => void): void;
        addEventListener(method: 'open', cb?: (event: {target: WebSocket}) => void): void;
        addEventListener(method: string, listener?: () => void): void;

        // Events
        on(event: 'error', cb: (err: Error) => void): this;
        on(event: 'close', cb: (code: number, message: string) => void): this;
        on(event: 'message', cb: (data: any, flags: {binary: boolean}) => void): this;
        on(event: 'ping', cb: (data: any, flags: {binary: boolean}) => void): this;
        on(event: 'pong', cb: (data: any, flags: {binary: boolean}) => void): this;
        on(event: 'open', cb: () => void): this;
        on(event: string, listener: () => void): this;

        addListener(event: 'error', cb: (err: Error) => void): this;
        addListener(event: 'close', cb: (code: number, message: string) => void): this;
        addListener(event: 'message', cb: (data: any, flags: {binary: boolean}) => void): this;
        addListener(event: 'ping', cb: (data: any, flags: {binary: boolean}) => void): this;
        addListener(event: 'pong', cb: (data: any, flags: {binary: boolean}) => void): this;
        addListener(event: 'open', cb: () => void): this;
        addListener(event: string, listener: () => void): this;
    }

    export = WebSocket;
} */

declare module "ws" {
    interface MessageEvent {
      data: any;
    }
  
    interface CloseEvent {
      code: number;
      reason: string;
      wasClean: boolean;
    }
  
    class WebSocket {
      public onopen: () => void;
      public onmessage: (event: MessageEvent) => void;
      public onclose: (event: CloseEvent) => void;
  
      constructor(url: string);
      send(data: string): void;
      close(code?: number, reason?: string): void;
    }
    export = WebSocket;
  }