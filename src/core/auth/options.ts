export interface AuthOptions {
  params: any;
  headers : any;
}

export interface AuthorizerOptions {
  authTransport: "ajax" | "jsonp";
  auth: AuthOptions;
}
