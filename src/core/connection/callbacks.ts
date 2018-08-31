import HandshakePayload from './handshake/handshake_payload';
import Action from './protocol/action';

export interface ErrorCallbacks {
  tls_only: (result: Action | HandshakePayload) => void;
  refused: (result: Action | HandshakePayload) => void;
  backoff: (result: Action | HandshakePayload) => void;
  retry: (result: Action | HandshakePayload) => void;
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
