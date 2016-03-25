export default class Timeline {
    key: string;
    session: number;
    events: any[];
    options: any;
    sent: number;
    uniqueID: number;
    constructor(key: string, session: number, options: any);
    log(level: any, event: any): void;
    error(event: any): void;
    info(event: any): void;
    debug(event: any): void;
    isEmpty(): boolean;
    send(sendXHR: any, callback: any): boolean;
    generateUniqueID(): number;
}
