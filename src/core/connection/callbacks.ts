import HandshakePayload from './handshake/handshake_payload';

export interface ErrorCallbacks {
  ssl_only: (result: HandshakePayload) => void;
  refused: (result: HandshakePayload) => void;
  backoff: (result: HandshakePayload) => void;
  retry: (result: HandshakePayload) => void;
}

export interface HandshakeCallbacks {
  connected: (handshake: HandshakePayload) => void;
}

export interface ConnectionCallbacks {
  message: (message: any) => void;
  ping: () => void;
  activity: () => void;
  error: (error : any) => void;
  closed: () => void;
}
