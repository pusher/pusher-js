import Timeline from '../timeline/timeline';
import Strategy from '../strategies/strategy';
import StategyOptions from '../strategies/strategy_options';

interface ConnectionManagerOptions {
  timeline: Timeline;
  getStrategy: (StrategyOptions) => Strategy;
  unavailableTimeout: number;
  pongTimeout: number;
  activityTimeout: number;
}

export default ConnectionManagerOptions;
