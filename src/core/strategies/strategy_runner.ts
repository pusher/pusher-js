interface StrategyRunner {
  forceMinPriority: (number) => void;
  abort: () => void;
}

export default StrategyRunner;
