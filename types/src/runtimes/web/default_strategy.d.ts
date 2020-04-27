import Strategy from 'core/strategies/strategy';
import StrategyOptions from 'core/strategies/strategy_options';
import { Config } from 'core/config';
declare var getDefaultStrategy: (config: Config, baseOptions: StrategyOptions, defineTransport: Function) => Strategy;
export default getDefaultStrategy;
