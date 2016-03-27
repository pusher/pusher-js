export declare var getGlobalConfig: () => {
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
export declare var getClusterConfig: (clusterName: any) => {
    wsHost: string;
    httpHost: string;
};
