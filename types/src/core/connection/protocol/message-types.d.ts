interface PusherEvent {
    event: string;
    channel?: string;
    data?: any;
    user_id?: string;
}
export { PusherEvent };
