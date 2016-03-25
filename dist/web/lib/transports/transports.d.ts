import Transport from "./transport.ts";
/** WebSocket transport.
 *
 * Uses native WebSocket implementation, including MozWebSocket supported by
 * earlier Firefox versions.
 */
export declare var WSTransport: Transport;
/** HTTP streaming transport using CORS-enabled XMLHttpRequest. */
export declare var XHRStreamingTransport: Transport;
/** HTTP streaming transport using XDomainRequest (IE 8,9). */
export declare var XDRStreamingTransport: Transport;
/** HTTP long-polling transport using CORS-enabled XMLHttpRequest. */
export declare var XHRPollingTransport: Transport;
/** HTTP long-polling transport using XDomainRequest (IE 8,9). */
export declare var XDRPollingTransport: Transport;
