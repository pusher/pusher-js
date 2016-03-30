declare enum ConnectionState {
    const,
    CLOSED,
    NEW,
    INITIALIZED,
    INITIALIZING,
    CONNECTING,
    FAILED,
    DISCONNECTED,
    UNAVAILABLE,
    CONNECTED,
}
export default ConnectionState;
