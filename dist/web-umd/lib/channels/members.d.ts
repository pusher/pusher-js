/** Represents a collection of members of a presence channel. */
export default class Members {
    members: any;
    count: number;
    myID: any;
    me: any;
    constructor();
    /** Returns member's info for given id.
     *
     * Resulting object containts two fields - id and info.
     *
     * @param {Number} id
     * @return {Object} member's info or null
     */
    get(id: string): any;
    /** Calls back for each member in unspecified order.
     *
     * @param  {Function} callback
     */
    each(callback: Function): void;
    /** Updates the id for connected member. For internal use only. */
    setMyID(id: string): void;
    /** Handles subscription data. For internal use only. */
    onSubscription(subscriptionData: any): void;
    /** Adds a new member to the collection. For internal use only. */
    addMember(memberData: any): any;
    /** Adds a member from the collection. For internal use only. */
    removeMember(memberData: any): any;
    /** Resets the collection to the initial state. For internal use only. */
    reset(): void;
}
