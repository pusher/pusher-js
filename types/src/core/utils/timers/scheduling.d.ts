interface Scheduler {
    (TimedCallback: any, number: any): number;
}
interface Canceller {
    (number: any): void;
}
type Delay = number;
export { Scheduler, Canceller, Delay };
