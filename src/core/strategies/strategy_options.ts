import Timeline from '../timeline/timeline';

interface StrategyOptions {
  timeline?: Timeline;
  ttl?: number;
  useTLS?: boolean;
  ignoreNullOrigin?: boolean;
  loop?: boolean;
  failFast?: boolean;
  timeout?: number;
  timeoutLimit?: number;
  key?: string;

  hostNonTLS?: string;
  hostTLS?: string;
  httpPath?: string;
}

export default StrategyOptions;
