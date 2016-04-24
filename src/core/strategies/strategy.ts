import StrategyRunner from "./strategy_runner";

interface Strategy {
  isSupported() : boolean;
  connect(minPriority: number, callback: Function) : StrategyRunner;
}

export default Strategy;
