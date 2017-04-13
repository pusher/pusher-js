import Channel from "../channels/channel";

export interface AuthOptions {
  params: any;
  headers : any;
}

export interface Authorizer {
	authorize(socketId : string, callback : Function)
}

export interface AuthorizerGenerator {
  (channel: Channel, options : AuthorizerOptions): Authorizer
}

export interface AuthorizerOptions {
  authTransport: "ajax" | "jsonp";
  auth: AuthOptions;
  authorizer: AuthorizerGenerator;
}
