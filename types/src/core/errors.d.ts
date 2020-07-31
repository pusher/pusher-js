export declare class BadEventName extends Error {
    constructor(msg?: string);
}
export declare class RequestTimedOut extends Error {
    constructor(msg?: string);
}
export declare class TransportPriorityTooLow extends Error {
    constructor(msg?: string);
}
export declare class TransportClosed extends Error {
    constructor(msg?: string);
}
export declare class UnsupportedFeature extends Error {
    constructor(msg?: string);
}
export declare class UnsupportedTransport extends Error {
    constructor(msg?: string);
}
export declare class UnsupportedStrategy extends Error {
    constructor(msg?: string);
}
export declare class HTTPAuthError extends Error {
    status: number;
    constructor(status: number, msg?: string);
}
