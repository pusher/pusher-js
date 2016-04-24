export default class Members {
    members: any;
    count: number;
    myID: any;
    me: any;
    constructor();
    get(id: string): any;
    each(callback: Function): void;
    setMyID(id: string): void;
    onSubscription(subscriptionData: any): void;
    addMember(memberData: any): any;
    removeMember(memberData: any): any;
    reset(): void;
}
