enum ConnectionState {
  OPEN = <any>"open",
  CLOSED = <any>"closed",
  NEW = <any> "new",
  INITIALIZED = <any> "initialized",
  INITIALIZING = <any> "initializing",

  CONNECTING = <any> "connecting",
  FAILED = <any> "failed",
  DISCONNECTED = <any> "disconnected",
  UNAVAILABLE = <any> "unavailable",
  CONNECTED = <any> "connected"
}

export default ConnectionState;
