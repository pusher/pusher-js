export declare var getGlobalConfig: () => {
    wsHost: string;
    wsPort: number;
    wssPort: number;
    wsPath: string;
    httpHost: string;
    httpPort: number;
    httpsPort: number;
    httpPath: string;
    statsHost: string;
    authEndpoint: string;
    authTransport: string;
    activityTimeout: number;
    pongTimeout: number;
    unavailableTimeout: number;
};
export declare var getClusterConfig: (clusterName: any) => {
    wsHost: string;
    httpHost: string;
};
