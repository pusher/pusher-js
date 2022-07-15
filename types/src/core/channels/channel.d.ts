import { default as EventsDispatcher } from '../events/dispatcher';
import Pusher from '../pusher';
import { PusherEvent } from '../connection/protocol/message-types';
import { ChannelAuthorizationCallback } from '../auth/options';
export default class Channel extends EventsDispatcher {
    name: string;
    pusher: Pusher;
    subscribed: boolean;
    subscriptionPending: boolean;
    subscriptionCancelled: boolean;
    subscriptionCount: null;
    constructor(name: string, pusher: Pusher);
    authorize(socketId: string, callback: ChannelAuthorizationCallback): void;
    trigger(event: string, data: any): boolean;
    disconnect(): void;
    handleEvent(event: PusherEvent): void;
    handleSubscriptionSucceededEvent(event: PusherEvent): void;
    handleSubscriptionCountEvent(event: PusherEvent): void;
    subscribe(): void;
    unsubscribe(): void;
    cancelSubscription(): void;
    reinstateSubscription(): void;
}
