interface Scheduler {
  (TimedCallback, number): number;
}

interface Canceller {
  (number): void;
}

type Delay = number;

export type { Scheduler, Canceller, Delay };
