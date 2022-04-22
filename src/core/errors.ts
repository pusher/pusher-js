/** Error classes used throughout the library. */
// https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
export class BadEventName extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadChannelName extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RequestTimedOut extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class TransportPriorityTooLow extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class TransportClosed extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class UnsupportedFeature extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class UnsupportedTransport extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class UnsupportedStrategy extends Error {
  constructor(msg?: string) {
    super(msg);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class HTTPAuthError extends Error {
  status: number;
  constructor(status: number, msg?: string) {
    super(msg);
    this.status = status;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
