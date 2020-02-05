interface Scheduler {
    (TimedCallback: any, number: any): number;
}
interface Canceller {
    (number: any): void;
}
declare type Delay = number;
export { Scheduler, Canceller, Delay };
