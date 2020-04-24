import Timeline from '../timeline/timeline';

interface StrategyOptions {
  failFast?: boolean;
  hostNonTLS?: string;
  hostTLS?: string;
  httpPath?: string;
  ignoreNullOrigin?: boolean;
  key?: string;
  loop?: boolean;
  timeline?: Timeline;
  timeout?: number;
  timeoutLimit?: number;
  ttl?: number;
  useTLS?: boolean;
}

export default StrategyOptions;
