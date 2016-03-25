interface StrategyOptions {
  ttl?: number;
  timeline?: any;
  encrypted?: boolean;
  ignoreNullOrigin?: boolean;
  loop?: boolean;
  failFast?: boolean;
  timeout?: number;
  timeoutLimit?: number;
}

export default StrategyOptions;
