interface Scheduler {
  (TimedCallback, number): number;
}

interface Canceller {
  (number): void;
}

type Delay = number;

export { Scheduler, Canceller, Delay };
