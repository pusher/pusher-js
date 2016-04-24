export declare var getGlobalConfig: () => {
    wsHost: string;
    wsPort: number;
    wssPort: number;
    httpHost: string;
    httpPort: number;
    httpsPort: number;
    httpPath: string;
    statsHost: string;
    authEndpoint: string;
    authTransport: string;
    activity_timeout: number;
    pong_timeout: number;
    unavailable_timeout: number;
};
export declare var getClusterConfig: (clusterName: any) => {
    wsHost: string;
    httpHost: string;
};
