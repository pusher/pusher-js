declare module "base64" {
    export default function encode(s: any): string;
}
declare module "utils/collections" {
    export function extend(target: any, ...sources: any[]): any;
    export function stringify(): string;
    export function arrayIndexOf(array: any[], item: any): number;
    export function objectApply(object: any, f: Function): void;
    export function keys(object: any): string[];
    export function values(object: any): any[];
    export function apply(array: any[], f: Function, context?: any): void;
    export function map(array: any[], f: Function): any[];
    export function mapObject(object: any, f: Function): any;
    export function filter(array: any[], test: Function): any[];
    export function filterObject(object: Object, test: Function): {};
    export function flatten(object: Object): any[];
    export function any(array: any[], test: Function): boolean;
    export function all(array: any[], test: Function): boolean;
    export function encodeParamsObject(data: any): string;
}
declare module "defaults" {
    var Defaults: any;
    export default Defaults;
}
declare module "transports/url_scheme" {
    interface URLScheme {
        getInitial(key: string, params: any): string;
        getPath?(key: string, options: any): string;
    }
    export default URLScheme;
}
declare module "transports/url_schemes" {
    import URLScheme from "transports/url_scheme";
    export var ws: URLScheme;
    export var http: URLScheme;
    export var sockjs: URLScheme;
}
declare module "utils/timers/timed_callback" {
    interface TimedCallback {
        (number?: any): number | void;
    }
    export default TimedCallback;
}
declare module "utils/timers/scheduling" {
    interface Scheduler {
        (TimedCallback: any, number: any): number;
    }
    interface Canceller {
        (number: any): void;
    }
    type Delay = number;
    export { Scheduler, Canceller, Delay };
}
declare module "utils/timers/abstract_timer" {
    import TimedCallback from "utils/timers/timed_callback";
    import { Delay, Scheduler, Canceller } from "utils/timers/scheduling";
    abstract class Timer {
        protected clear: Canceller;
        protected timer: number | void;
        constructor(set: Scheduler, clear: Canceller, delay: Delay, callback: TimedCallback);
        isRunning(): boolean;
        ensureAborted(): void;
    }
    export default Timer;
}
declare module "utils/timers/index" {
    import Timer from "utils/timers/abstract_timer";
    import TimedCallback from "utils/timers/timed_callback";
    import { Delay } from "utils/timers/scheduling";
    export class OneOffTimer extends Timer {
        constructor(delay: Delay, callback: TimedCallback);
    }
    export class PeriodicTimer extends Timer {
        constructor(delay: Delay, callback: TimedCallback);
    }
}
declare module "node_modules/pusher-websocket-iso-externals-node/xhr" {
    import { XMLHttpRequest } from "xmlhttprequest";
    var XHR: {
        getAPI(): typeof XMLHttpRequest;
    };
    export default XHR;
}
declare module "util" {
    import TimedCallback from "utils/timers/timed_callback";
    import { OneOffTimer } from "utils/timers/index";
    var Util: {
        now(): number;
        defer(callback: TimedCallback): OneOffTimer;
        method(name: string, ...args: any[]): Function;
    };
    export default Util;
}
declare module "transports/ping_delay_options" {
    interface PingDelayOptions {
        minPingDelay: number;
        maxPingDelay: number;
        pingDelay?: number;
    }
    export default PingDelayOptions;
}
declare module "transports/transport_manager" {
    import AssistantToTheTransportManager from "transports/assistant_to_the_transport_manager";
    import Transport from "transports/transport";
    export default class TransportManager {
        options: any;
        livesLeft: number;
        constructor(options: any);
        getAssistant(transport: Transport): AssistantToTheTransportManager;
        isAlive(): boolean;
        reportDeath(): void;
    }
}
declare module "transports/assistant_to_the_transport_manager" {
    import TransportManager from "transports/transport_manager";
    import Transport from "transports/transport";
    import PingDelayOptions from "transports/ping_delay_options";
    export default class AssistantToTheTransportManager implements PingDelayOptions {
        manager: TransportManager;
        transport: Transport;
        minPingDelay: number;
        maxPingDelay: number;
        pingDelay: number;
        constructor(manager: TransportManager, transport: Transport, options: any);
        createConnection(name: string, priority: number, key: string, options: Object): any;
        isSupported(environment: any): boolean;
    }
}
declare module "connection/handshake/handshake_results" {
    enum HandshakeResults {
        CONNECTED,
        BACKOFF,
        SSL_ONLY,
        REFUSED,
        RETRY,
    }
    export default HandshakeResults;
}
declare module "connection/protocol/action" {
    import Descriptions from "connection/handshake/handshake_results";
    interface Action {
        action: Descriptions;
        id?: string;
        activityTimeout?: number;
        error?: any;
    }
    export default Action;
}
declare module "connection/protocol/internal_events" {
    enum InternalEvents {
        CONNECTION_ESTABLISHED,
        ERROR,
    }
    export default InternalEvents;
}
declare module "connection/protocol/message" {
    import InternalEvents from "connection/protocol/internal_events";
    interface Message {
        event: string | InternalEvents;
        channel?: string;
        data?: any;
    }
    export default Message;
}
declare module "connection/protocol/protocol" {
    import Action from "connection/protocol/action";
    import Message from "connection/protocol/message";
    import HandshakeResults from "connection/handshake/handshake_results";
    export var decodeMessage: (message: Message) => Message;
    export var encodeMessage: (message: Message) => string;
    export var processHandshake: (message: Message) => Action;
    export var getCloseAction: (closeEvent: any) => HandshakeResults;
    export var getCloseError: (closeEvent: any) => any;
}
declare module "events/callback" {
    interface Callback {
        fn: Function;
        context: any;
    }
    export default Callback;
}
declare module "events/callback_table" {
    import Callback from "events/callback";
    interface CallbackTable {
        [index: string]: Callback[];
    }
    export default CallbackTable;
}
declare module "events/callback_registry" {
    import Callback from "events/callback";
    import CallbackTable from "events/callback_table";
    export default class CallbackRegistry {
        _callbacks: CallbackTable;
        constructor();
        get(name: string): Callback[];
        add(name: string, callback: Function, context: any): void;
        remove(name?: string, callback?: Function, context?: any): void;
    }
}
declare module "events/dispatcher" {
    import CallbackRegistry from "events/callback_registry";
    export default class Dispatcher {
        callbacks: CallbackRegistry;
        global_callbacks: Function[];
        failThrough: Function;
        constructor(failThrough?: Function);
        bind(eventName: string, callback: Function, context?: any): this;
        bind_all(callback: Function): this;
        unbind(eventName: string, callback: Function, context?: any): this;
        unbind_all(eventName?: string, callback?: Function): this;
        emit(eventName: string, data?: any): Dispatcher;
    }
}
declare module "logger" {
    var Logger: {
        log: any;
        debug(...args: any[]): void;
        warn(...args: any[]): void;
    };
    export default Logger;
}
declare module "connection/state" {
    enum ConnectionState {
        OPEN,
        CLOSED,
        NEW,
        INITIALIZED,
        INITIALIZING,
        CONNECTING,
        FAILED,
        DISCONNECTED,
        UNAVAILABLE,
        CONNECTED,
    }
    export default ConnectionState;
}
declare module "socket/socket" {
    interface Socket {
        send(payload: any): void;
        ping?(): void;
        close(code?: any, reason?: any): any;
        sendRaw?(payload: any): boolean;
        onopen?(): void;
        onerror?(error: any): void;
        onclose?(closeEvent: any): void;
        onmessage?(message: any): void;
        onactivity?(): void;
    }
    export default Socket;
}
declare module "transports/transport_hooks" {
    import URLScheme from "transports/url_scheme";
    import Socket from "socket/socket";
    interface TransportHooks {
        file?: string;
        urls: URLScheme;
        handlesActivityChecks: boolean;
        supportsPing: boolean;
        isInitialized(): boolean;
        isSupported(environment?: any): boolean;
        getSocket(url: string, options?: any): Socket;
        beforeOpen?: Function;
    }
    export default TransportHooks;
}
declare module "runtimes/dom/script_receiver" {
    interface ScriptReceiver {
        number: number;
        id: string;
        name: string;
        callback: Function;
    }
    export default ScriptReceiver;
}
declare module "runtimes/dom/script_receiver_factory" {
    import ScriptReceiver from "runtimes/dom/script_receiver";
    export class ScriptReceiverFactory {
        lastId: number;
        prefix: string;
        name: string;
        constructor(prefix: string, name: string);
        create(callback: Function): ScriptReceiver;
        remove(receiver: ScriptReceiver): void;
    }
    export var ScriptReceivers: ScriptReceiverFactory;
}
declare module "runtimes/dom/script_request" {
    import ScriptReceiver from "runtimes/dom/script_receiver";
    export default class ScriptRequest {
        src: string;
        script: any;
        errorScript: any;
        constructor(src: string);
        send(receiver: ScriptReceiver): void;
        cleanup(): void;
    }
}
declare module "runtimes/dom/dependency_loader" {
    import { ScriptReceiverFactory } from "runtimes/dom/script_receiver_factory";
    export default class DependencyLoader {
        options: any;
        receivers: ScriptReceiverFactory;
        loading: any;
        constructor(options: any);
        load(name: string, options: any, callback: Function): void;
        getRoot(options: any): string;
        getPath(name: string, options: any): string;
    }
}
declare module "runtimes/dom/dependencies" {
    import { ScriptReceiverFactory } from "runtimes/dom/script_receiver_factory";
    import DependencyLoader from "runtimes/dom/dependency_loader";
    export var DependenciesReceivers: ScriptReceiverFactory;
    export var Dependencies: DependencyLoader;
}
declare module "transports/transport_connection" {
    import { default as EventsDispatcher } from "events/dispatcher";
    import ConnectionState from "connection/state";
    import TransportHooks from "transports/transport_hooks";
    import Socket from "socket/socket";
    export default class TransportConnection extends EventsDispatcher {
        hooks: TransportHooks;
        name: string;
        priority: number;
        key: string;
        options: any;
        state: ConnectionState;
        timeline: any;
        activityTimeout: number;
        id: string;
        socket: Socket;
        beforeOpen: Function;
        constructor(hooks: TransportHooks, name: string, priority: number, key: string, options: any);
        handlesActivityChecks(): boolean;
        supportsPing(): boolean;
        initialize(): void;
        connect(): boolean;
        close(): boolean;
        send(data: any): boolean;
        ping(): void;
        onOpen(): void;
        onError(error: any): void;
        onClose(closeEvent?: any): void;
        onMessage(message: any): void;
        onActivity(): void;
        bindListeners(): void;
        unbindListeners(): void;
        changeState(state: ConnectionState, params?: any): void;
        buildTimelineMessage(message: any): any;
    }
}
declare module "connection/connection" {
    import { default as EventsDispatcher } from "events/dispatcher";
    import TransportConnection from "transports/transport_connection";
    import Socket from "socket/socket";
    export default class Connection extends EventsDispatcher implements Socket {
        id: string;
        transport: TransportConnection;
        activityTimeout: number;
        constructor(id: string, transport: TransportConnection);
        handlesActivityChecks(): boolean;
        send(data: any): boolean;
        send_event(name: string, data: any, channel?: string): boolean;
        ping(): void;
        close(): void;
        bindListeners(): void;
        handleCloseEvent(closeEvent: any): void;
    }
}
declare module "connection/handshake/handshake_payload" {
    import TransportConnection from "transports/transport_connection";
    import Action from "connection/protocol/action";
    import Connection from "connection/connection";
    interface HandshakePayload {
        transport: TransportConnection;
        action: Action;
        connection?: Connection;
        activityTimeout?: number;
        error: any;
    }
    export default HandshakePayload;
}
declare module "connection/handshake/index" {
    import TransportConnection from "transports/transport_connection";
    export default class Handshake {
        transport: TransportConnection;
        callback: (HandshakePayload) => void;
        onMessage: Function;
        onClosed: Function;
        constructor(transport: TransportConnection, callback: (HandshakePayload) => void);
        close(): void;
        bindListeners(): void;
        unbindListeners(): void;
        finish(action: any, params: any): void;
    }
}
declare module "http/status" {
    enum Status {
        OK = 200,
    }
    export default Status;
}
declare module "http/url_location" {
    interface URLLocation {
        base: string;
        queryString: string;
    }
    export default URLLocation;
}
declare module "http/socket_hooks" {
    import URLLocation from "http/url_location";
    interface SocketHooks {
        getReceiveURL(url: URLLocation, session: string): string;
        onHeartbeat(Socket: any): void;
        sendHeartbeat(Socket: any): void;
        onFinished(Socket: any, Status: any): void;
    }
    export default SocketHooks;
}
declare module "http/state" {
    enum State {
        CONNECTING = 0,
        OPEN = 1,
        CLOSED = 3,
    }
    export default State;
}
declare module "node_modules/pusher-websocket-iso-externals-node/app" {
    export var addUnloadListener: (listener: any) => void;
    export var removeUnloadListener: (listener: any) => void;
}
declare module "http/ajax" {
    interface Ajax {
        open(method: string, url: string, async: boolean): Function;
        send(payload?: any): Function;
        onreadystatechange: Function;
        readyState: number;
        responseText: string;
        ontimeout: Function;
        onerror: Function;
        onprogress: Function;
        onload: Function;
        abort: Function;
    }
    export default Ajax;
}
declare module "http/request_hooks" {
    import Ajax from "http/ajax";
    interface RequestHooks {
        getRequest(HTTPRequest: any): Ajax;
        abortRequest(HTTPRequest: any): void;
    }
    export default RequestHooks;
}
declare module "http/http_request" {
    import RequestHooks from "http/request_hooks";
    import Ajax from "http/ajax";
    import { default as EventsDispatcher } from "events/dispatcher";
    import Status from "http/status";
    export default class HTTPRequest extends EventsDispatcher {
        hooks: RequestHooks;
        method: string;
        url: string;
        position: number;
        xhr: Ajax;
        unloader: Function;
        constructor(hooks: RequestHooks, method: string, url: string);
        start(payload?: any): void;
        close(): void;
        onChunk(status: Status, data: any): void;
        advanceBuffer(buffer: any[]): any;
        isBufferTooLong(buffer: any): boolean;
    }
}
declare module "http/http_xhr_request" {
    import RequestHooks from "http/request_hooks";
    var hooks: RequestHooks;
    export default hooks;
}
declare module "errors" {
    export class BadEventName extends Error {
    }
    export class RequestTimedOut extends Error {
    }
    export class TransportPriorityTooLow extends Error {
    }
    export class TransportClosed extends Error {
    }
    export class UnsupportedTransport extends Error {
    }
    export class UnsupportedStrategy extends Error {
    }
}
declare module "http/http_xdomain_request" {
    import RequestHooks from "http/request_hooks";
    var hooks: RequestHooks;
    export default hooks;
}
declare module "http/http_streaming_socket" {
    import SocketHooks from "http/socket_hooks";
    var hooks: SocketHooks;
    export default hooks;
}
declare module "http/http_polling_socket" {
    import SocketHooks from "http/socket_hooks";
    var hooks: SocketHooks;
    export default hooks;
}
declare module "http/http" {
    import HTTPRequest from "http/http_request";
    import HTTPSocket from "http/http_socket";
    import SocketHooks from "http/socket_hooks";
    import RequestHooks from "http/request_hooks";
    var HTTP: {
        createStreamingSocket(url: string): HTTPSocket;
        createPollingSocket(url: string): HTTPSocket;
        createSocket(hooks: SocketHooks, url: string): HTTPSocket;
        createXHR(method: string, url: string): HTTPRequest;
        createXDR(method: string, url: string): HTTPRequest;
        createRequest(hooks: RequestHooks, method: string, url: string): HTTPRequest;
    };
    export default HTTP;
}
declare module "http/http_socket" {
    import URLLocation from "http/url_location";
    import State from "http/state";
    import Socket from "socket/socket";
    import SocketHooks from "http/socket_hooks";
    import HTTPRequest from "http/http_request";
    class HTTPSocket implements Socket {
        hooks: SocketHooks;
        session: string;
        location: URLLocation;
        readyState: State;
        stream: HTTPRequest;
        onopen: () => void;
        onerror: (error: any) => void;
        onclose: (closeEvent: any) => void;
        onmessage: (message: any) => void;
        onactivity: () => void;
        constructor(hooks: SocketHooks, url: string);
        send(payload: any): boolean;
        ping(): void;
        close(code: any, reason: any): void;
        sendRaw(payload: any): boolean;
        reconnect(): void;
        onClose(code: any, reason: any, wasClean: any): void;
        onChunk(chunk: any): void;
        onOpen(options: any): void;
        onEvent(event: any): void;
        onActivity(): void;
        onError(error: any): void;
        openStream(): void;
        closeStream(): void;
    }
    export default HTTPSocket;
}
declare module "channels/channel" {
    import { default as EventsDispatcher } from "events/dispatcher";
    import Pusher from "pusher";
    export default class Channel extends EventsDispatcher {
        name: string;
        pusher: any;
        subscribed: boolean;
        constructor(name: string, pusher: Pusher);
        authorize(socketId: string, callback: Function): any;
        trigger(event: string, data: any): any;
        disconnect(): void;
        handleEvent(event: string, data: any): void;
        subscribe(): void;
        unsubscribe(): void;
    }
}
declare module "runtimes/dom/jsonp_request" {
    import ScriptReceiver from "runtimes/dom/script_receiver";
    import ScriptRequest from "runtimes/dom/script_request";
    export default class JSONPRequest {
        url: string;
        data: any;
        request: ScriptRequest;
        constructor(url: string, data: any);
        send(receiver: ScriptReceiver): void;
        cleanup(): void;
    }
}
declare module "timeline/level" {
    enum TimelineLevel {
        ERROR = 3,
        INFO = 6,
        DEBUG = 7,
    }
    export default TimelineLevel;
}
declare module "timeline/timeline" {
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
        send(sendfn: any, callback: any): boolean;
        generateUniqueID(): number;
    }
}
declare module "timeline/timeline_sender" {
    import Timeline from "timeline/timeline";
    export default class TimelineSender {
        timeline: Timeline;
        options: any;
        host: string;
        constructor(timeline: Timeline, options: any);
        send(encrypted: boolean, callback?: Function): void;
    }
}
declare module "timeline/timeline_transports" {
    import TimelineSender from "timeline/timeline_sender";
    interface TimelineTransport {
        (data: any, callback: Function): void;
    }
    var jsonp: (sender: TimelineSender, encrypted: boolean) => TimelineTransport;
    var xhr: (sender: TimelineSender, encrypted: boolean) => TimelineTransport;
    export { TimelineTransport, jsonp, xhr };
}
declare module "runtimes/browser" {
    import Runtime from "runtimes/abstract_runtime";
    import { AuthTransports } from "auth_transports";
    import { TimelineTransport } from "timeline/timeline_transports";
    import TimelineSender from "timeline/timeline_sender";
    export default class Browser extends Runtime {
        whenReady(callback: Function): void;
        getDocument(): any;
        getProtocol(): string;
        isXHRSupported(): boolean;
        isSockJSSupported(): boolean;
        isXDRSupported(encrypted?: boolean): boolean;
        getGlobal(): any;
        getAuthorizers(): AuthTransports;
        getTimelineTransport(sender: TimelineSender, encrypted: boolean): TimelineTransport;
        private onDocumentBody(callback);
    }
}
declare module "auth_transports" {
    import AbstractRuntime from "runtimes/abstract_runtime";
    interface AuthTransport {
        (context: AbstractRuntime, socketId: string, callback: Function): void;
    }
    interface AuthTransports {
        [index: string]: AuthTransport;
    }
    var ajax: AuthTransport;
    var jsonp: AuthTransport;
    export { AuthTransport, AuthTransports, ajax, jsonp };
}
declare module "pusher_authorizer" {
    import Channel from "channels/channel";
    import { AuthTransports } from "auth_transports";
    export default class Authorizer {
        static authorizers: AuthTransports;
        channel: Channel;
        type: string;
        options: any;
        authOptions: any;
        constructor(channel: Channel, options: any);
        composeQuery(socketId: string): string;
        authorize(socketId: string, callback: Function): any;
    }
}
declare module "channels/private_channel" {
    import Channel from "channels/channel";
    export default class PrivateChannel extends Channel {
        authorize(socketId: string, callback: Function): any;
    }
}
declare module "channels/members" {
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
}
declare module "channels/presence_channel" {
    import PrivateChannel from "channels/private_channel";
    import Members from "channels/members";
    import Pusher from "pusher";
    export default class PresenceChannel extends PrivateChannel {
        members: Members;
        constructor(name: string, pusher: Pusher);
        authorize(socketId: string, callback: Function): void;
        handleEvent(event: string, data: any): void;
        disconnect(): void;
    }
}
declare module "node_modules/pusher-websocket-iso-externals-node/net_info" {
    import { default as EventsDispatcher } from "events/dispatcher";
    export class NetInfo extends EventsDispatcher {
        isOnline(): boolean;
    }
    export var Network: NetInfo;
}
declare module "strategies/strategy_runner" {
    interface StrategyRunner {
        forceMinPriority: (number) => void;
        abort: () => void;
    }
    export default StrategyRunner;
}
declare module "strategies/strategy" {
    import StrategyRunner from "strategies/strategy_runner";
    interface Strategy {
        isSupported(): boolean;
        connect(minPriority: number, callback: Function): StrategyRunner;
    }
    export default Strategy;
}
declare module "connection/connection_manager" {
    import { default as EventsDispatcher } from "events/dispatcher";
    import { OneOffTimer as Timer } from "utils/timers/index";
    import ConnectionState from "connection/state";
    import Connection from "connection/connection";
    import Strategy from "strategies/strategy";
    import StrategyRunner from "strategies/strategy_runner";
    export default class ConnectionManager extends EventsDispatcher {
        key: string;
        options: any;
        state: ConnectionState;
        connection: Connection;
        encrypted: boolean;
        timeline: any;
        socket_id: string;
        unavailableTimer: Timer;
        activityTimer: Timer;
        retryTimer: Timer;
        activityTimeout: number;
        strategy: Strategy;
        runner: StrategyRunner;
        errorCallbacks: any;
        handshakeCallbacks: any;
        connectionCallbacks: any;
        constructor(key: string, options: any);
        connect(): void;
        send(data: any): boolean;
        send_event(name: string, data: any, channel?: string): boolean;
        disconnect(): void;
        isEncrypted(): boolean;
        startConnecting(): void;
        abortConnecting(): void;
        disconnectInternally(): void;
        updateStrategy(): void;
        retryIn(delay: any): void;
        clearRetryTimer(): void;
        setUnavailableTimer(): void;
        clearUnavailableTimer(): void;
        sendActivityCheck(): void;
        resetActivityCheck(): void;
        stopActivityCheck(): void;
        buildConnectionCallbacks(): {
            message: (message: any) => void;
            ping: () => void;
            activity: () => void;
            error: (error: any) => void;
            closed: () => void;
        };
        buildHandshakeCallbacks(errorCallbacks: any): any;
        buildErrorCallbacks(): {
            ssl_only: (result: any) => void;
            refused: (result: any) => void;
            backoff: (result: any) => void;
            retry: (result: any) => void;
        };
        setConnection(connection: any): void;
        abandonConnection(): Connection;
        updateState(newState: ConnectionState, data?: any): void;
        shouldRetry(): boolean;
    }
}
declare module "channels/channel_table" {
    import Channel from "channels/channel";
    interface ChannelTable {
        [index: string]: Channel;
    }
    export default ChannelTable;
}
declare module "channels/channels" {
    import Channel from "channels/channel";
    import ChannelTable from "channels/channel_table";
    export default class Channels {
        channels: ChannelTable;
        constructor();
        add(name: string, pusher: any): Channel;
        all(): Channel[];
        find(name: string): Channel;
        remove(name: string): Channel;
        disconnect(): void;
    }
}
declare module "node_modules/pusher-websocket-iso-externals-web/net_info" {
    import { default as EventsDispatcher } from "events/dispatcher";
    export class NetInfo extends EventsDispatcher {
        constructor();
        isOnline(): boolean;
    }
    export var Network: NetInfo;
}
declare module "node_modules/pusher-websocket-iso-externals-node/ws" {
    var WS: {
        getAPI(): any;
    };
    export default WS;
}
declare module "utils/factory" {
    import AssistantToTheTransportManager from "transports/assistant_to_the_transport_manager";
    import Transport from "transports/transport";
    import TransportManager from "transports/transport_manager";
    import Handshake from "connection/handshake/index";
    import TransportConnection from "transports/transport_connection";
    import Authorizer from "pusher_authorizer";
    import Timeline from "timeline/timeline";
    import TimelineSender from "timeline/timeline_sender";
    import PresenceChannel from "channels/presence_channel";
    import PrivateChannel from "channels/private_channel";
    import Channel from "channels/channel";
    import ConnectionManager from "connection/connection_manager";
    import Ajax from "http/ajax";
    import Channels from "channels/channels";
    import { NetInfo } from "node_modules/pusher-websocket-iso-externals-web/net_info";
    import JSONPRequest from "runtimes/dom/jsonp_request";
    import ScriptRequest from "runtimes/dom/script_request";
    var Factory: {
        createXHR(): Ajax;
        createXMLHttpRequest(): Ajax;
        createMicrosoftXHR(): Ajax;
        createChannels(): Channels;
        createConnectionManager(key: string, options: any): ConnectionManager;
        createChannel(name: string, pusher: any): Channel;
        createPrivateChannel(name: string, pusher: any): PrivateChannel;
        createPresenceChannel(name: string, pusher: any): PresenceChannel;
        createTimelineSender(timeline: Timeline, options: any): TimelineSender;
        createAuthorizer(channel: Channel, options: any): Authorizer;
        createHandshake(transport: TransportConnection, callback: (HandshakePayload: any) => void): Handshake;
        getNetwork(): NetInfo;
        createWebSocket(url: string): any;
        createAssistantToTheTransportManager(manager: TransportManager, transport: Transport, options: any): AssistantToTheTransportManager;
        createJSONPRequest(url: string, data: any): JSONPRequest;
        createScriptRequest(src: string): ScriptRequest;
    };
    export default Factory;
}
declare module "transports/transport" {
    import TransportHooks from "transports/transport_hooks";
    import TransportConnection from "transports/transport_connection";
    export default class Transport {
        hooks: TransportHooks;
        constructor(hooks: TransportHooks);
        isSupported(environment: any): boolean;
        createConnection(name: string, priority: number, key: string, options: any): TransportConnection;
    }
}
declare module "transports/transports" {
    import Transport from "transports/transport";
    var Transports: {
        WSTransport: Transport;
        SockJSTransport: Transport;
        XHRStreamingTransport: Transport;
        XDRStreamingTransport: Transport;
        XHRPollingTransport: Transport;
        XDRPollingTransport: Transport;
    };
    export default Transports;
}
declare module "runtimes/abstract_runtime" {
    import { AuthTransports } from "auth_transports";
    import { TimelineTransport } from "timeline/timeline_transports";
    import TimelineSender from "timeline/timeline_sender";
    abstract class Runtime {
        abstract whenReady(callback: Function): void;
        abstract getProtocol(): string;
        abstract isXHRSupported(): boolean;
        abstract isXDRSupported(encrypted?: boolean): boolean;
        abstract isSockJSSupported(): boolean;
        abstract getDocument(): any;
        abstract getGlobal(): any;
        nextAuthCallbackID: number;
        auth_callbacks: any;
        ScriptReceivers: any;
        DependenciesReceivers: any;
        getLocalStorage(): any;
        getClientFeatures(): any[];
        getAuthorizers(): AuthTransports;
        getTimelineTransport(sender: TimelineSender, encrypted: boolean): TimelineTransport;
    }
    export default Runtime;
}
declare module "runtimes/isomorphic" {
    import Runtime from "runtimes/abstract_runtime";
    export default class Isomorphic extends Runtime {
        whenReady(callback: Function): void;
        getProtocol(): string;
        isXHRSupported(): boolean;
        isXDRSupported(encrypted?: boolean): boolean;
        isSockJSSupported(): boolean;
        getGlobal(): any;
        getDocument(): any;
    }
}
declare module "runtimes/runtime" {
    import Runtime from "runtimes/abstract_runtime";
    declare var _default: Runtime;
    export default _default;
}
declare module "strategies/strategy_options" {
    interface StrategyOptions {
        ttl?: number;
        timeline?: any;
        encrypted?: boolean;
        ignoreNullOrigin?: boolean;
        loop?: boolean;
        failFast?: boolean;
        timeout?: number;
        timeoutLimit?: number;
    }
    export default StrategyOptions;
}
declare module "strategies/transport_strategy" {
    import Strategy from "strategies/strategy";
    import Transport from "transports/transport";
    import StrategyOptions from "strategies/strategy_options";
    export default class TransportStrategy implements Strategy {
        name: string;
        priority: number;
        transport: Transport;
        options: any;
        constructor(name: string, priority: number, transport: Transport, options: StrategyOptions);
        isSupported(): boolean;
        connect(minPriority: number, callback: Function): {
            abort: () => void;
            forceMinPriority: (p: any) => void;
        };
    }
}
declare module "strategies/sequential_strategy" {
    import Strategy from "strategies/strategy";
    import StrategyOptions from "strategies/strategy_options";
    export default class SequentialStrategy implements Strategy {
        strategies: Strategy[];
        loop: boolean;
        failFast: boolean;
        timeout: number;
        timeoutLimit: number;
        constructor(strategies: Strategy[], options: StrategyOptions);
        isSupported(): boolean;
        connect(minPriority: number, callback: Function): {
            abort: () => void;
            forceMinPriority: (p: any) => void;
        };
        tryStrategy(strategy: Strategy, minPriority: number, options: StrategyOptions, callback: Function): {
            abort: () => void;
            forceMinPriority: (p: any) => void;
        };
    }
}
declare module "strategies/best_connected_ever_strategy" {
    import Strategy from "strategies/strategy";
    export default class BestConnectedEverStrategy implements Strategy {
        strategies: Strategy[];
        constructor(strategies: Strategy[]);
        isSupported(): boolean;
        connect(minPriority: number, callback: Function): {
            abort: () => void;
            forceMinPriority: (p: any) => void;
        };
    }
}
declare module "strategies/cached_strategy" {
    import Strategy from "strategies/strategy";
    import StrategyOptions from "strategies/strategy_options";
    import TransportStrategy from "strategies/transport_strategy";
    export default class CachedStrategy implements Strategy {
        strategy: Strategy;
        transports: TransportStrategy[];
        ttl: number;
        encrypted: boolean;
        timeline: any;
        constructor(strategy: Strategy, transports: TransportStrategy[], options: StrategyOptions);
        isSupported(): boolean;
        connect(minPriority: number, callback: Function): {
            abort: () => void;
            forceMinPriority: (p: any) => void;
        };
    }
}
declare module "strategies/delayed_strategy" {
    import Strategy from "strategies/strategy";
    export default class DelayedStrategy implements Strategy {
        strategy: Strategy;
        options: any;
        constructor(strategy: Strategy, {delay: number}: {
            delay: any;
        });
        isSupported(): boolean;
        connect(minPriority: number, callback: Function): {
            abort: () => void;
            forceMinPriority: (p: any) => void;
        };
    }
}
declare module "strategies/if_strategy" {
    import Strategy from "strategies/strategy";
    import StrategyRunner from "strategies/strategy_runner";
    export default class IfStrategy implements Strategy {
        test: () => boolean;
        trueBranch: Strategy;
        falseBranch: Strategy;
        constructor(test: () => boolean, trueBranch: Strategy, falseBranch: Strategy);
        isSupported(): boolean;
        connect(minPriority: number, callback: Function): StrategyRunner;
    }
}
declare module "strategies/first_connected_strategy" {
    import Strategy from "strategies/strategy";
    import StrategyRunner from "strategies/strategy_runner";
    export default class FirstConnectedStrategy implements Strategy {
        strategy: Strategy;
        constructor(strategy: Strategy);
        isSupported(): boolean;
        connect(minPriority: number, callback: Function): StrategyRunner;
    }
}
declare module "strategies/strategy_builder" {
    export var build: (scheme: any, options: any) => any;
}
declare module "config" {
    export var getGlobalConfig: () => {
        wsHost: any;
        wsPort: any;
        wssPort: any;
        httpHost: any;
        httpPort: any;
        httpsPort: any;
        httpPath: any;
        statsHost: any;
        authEndpoint: any;
        authTransport: any;
        activity_timeout: any;
        pong_timeout: any;
        unavailable_timeout: any;
    };
    export var getClusterConfig: (clusterName: any) => {
        wsHost: string;
        httpHost: string;
    };
}
declare module "pusher" {
    import Channels from "channels/channels";
    import Channel from "channels/channel";
    import { default as EventsDispatcher } from "events/dispatcher";
    import Timeline from "timeline/timeline";
    import TimelineSender from "timeline/timeline_sender";
    import ConnectionManager from "connection/connection_manager";
    import { PeriodicTimer } from "utils/timers/index";
    export default class Pusher {
        static instances: Pusher[];
        static isReady: boolean;
        static Runtime: any;
        static ScriptReceivers: any;
        static DependenciesReceivers: any;
        static ready(): void;
        static logToConsole(): void;
        static setLogger(logger: Function): void;
        key: string;
        config: any;
        channels: Channels;
        global_emitter: EventsDispatcher;
        sessionID: number;
        timeline: Timeline;
        timelineSender: TimelineSender;
        connection: ConnectionManager;
        timelineSenderTimer: PeriodicTimer;
        constructor(app_key: string, options: any);
        channel(name: string): Channel;
        allChannels(): Channel[];
        connect(): void;
        disconnect(): void;
        bind(event_name: string, callback: Function): Pusher;
        bind_all(callback: Function): Pusher;
        subscribeAll(): void;
        subscribe(channel_name: string): Channel;
        unsubscribe(channel_name: string): void;
        send_event(event_name: string, data: any, channel: string): boolean;
        isEncrypted(): boolean;
    }
}
declare module "node_modules/pusher-websocket-iso-externals-web/ws" {
    var WS: {
        getAPI(): any;
    };
    export default WS;
}
declare module "node_modules/pusher-websocket-iso-externals-web/xhr" {
    var XHR: {
        getAPI(): any;
    };
    export default XHR;
}
declare module "node_modules/pusher-websocket-iso-externals-web/app" {
    export var addUnloadListener: (listener: any) => void;
    export var removeUnloadListener: (listener: any) => void;
}
declare module "node_modules/pusher-websocket-iso-externals-react-native/net_info" {
    import EventsDispatcher from "events/dispatcher";
    export class NetInfo extends EventsDispatcher {
        online: boolean;
        constructor();
        isOnline(): boolean;
    }
    export var Network: NetInfo;
}
