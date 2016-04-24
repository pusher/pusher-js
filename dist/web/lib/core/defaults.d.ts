export interface DefaultConfig {
    VERSION: string;
    PROTOCOL: number;
    host: string;
    ws_port: number;
    wss_port: number;
    sockjs_host: string;
    sockjs_http_port: number;
    sockjs_https_port: number;
    sockjs_path: string;
    stats_host: string;
    channel_auth_endpoint: string;
    channel_auth_transport: string;
    activity_timeout: number;
    pong_timeout: number;
    unavailable_timeout: number;
    cdn_http?: string;
    cdn_https?: string;
    dependency_suffix?: string;
}
declare var Defaults: DefaultConfig;
export default Defaults;
