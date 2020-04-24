import Strategy from 'core/strategies/strategy';
import { Config } from 'core/config';
import StrategyOptions from 'core/strategies/strategy_options';
declare var getDefaultStrategy: (config: Config, baseOptions: StrategyOptions, defineTransport: Function) => Strategy;
export default getDefaultStrategy;
