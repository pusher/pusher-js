import Action from './action';
import Message from './message';
import HandshakeResults from '../handshake/handshake_results';
/**
 * Provides functions for handling Pusher protocol-specific messages.
 */
/**
 * Decodes a message in a Pusher format.
 *
 * Throws errors when messages are not parse'able.
 *
 * @param  {Object} message
 * @return {Object}
 */
export declare var decodeMessage: (message: Message) => Message;
/**
 * Encodes a message to be sent.
 *
 * @param  {Object} message
 * @return {String}
 */
export declare var encodeMessage: (message: Message) => string;
/** Processes a handshake message and returns appropriate actions.
 *
 * Returns an object with an 'action' and other action-specific properties.
 *
 * There are three outcomes when calling this function. First is a successful
 * connection attempt, when pusher:connection_established is received, which
 * results in a 'connected' action with an 'id' property. When passed a
 * pusher:error event, it returns a result with action appropriate to the
 * close code and an error. Otherwise, it raises an exception.
 *
 * @param {String} message
 * @result Object
 */
export declare var processHandshake: (message: Message) => Action;
/**
 * Dispatches the close event and returns an appropriate action name.
 *
 * See:
 * 1. https://developer.mozilla.org/en-US/docs/WebSockets/WebSockets_reference/CloseEvent
 * 2. http://pusher.com/docs/pusher_protocol
 *
 * @param  {CloseEvent} closeEvent
 * @return {String} close action name
 */
export declare var getCloseAction: (closeEvent: any) => HandshakeResults;
/**
 * Returns an error or null basing on the close event.
 *
 * Null is returned when connection was closed cleanly. Otherwise, an object
 * with error details is returned.
 *
 * @param  {CloseEvent} closeEvent
 * @return {Object} error object
 */
export declare var getCloseError: (closeEvent: any) => any;
