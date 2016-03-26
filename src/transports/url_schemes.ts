import {PROTOCOL, VERSION} from "../defaults.ts";
import URLScheme from "./url_scheme.ts";

function getGenericURL(baseScheme : string, params : any, path : string): string {
  var scheme = baseScheme + (params.encrypted ? "s" : "");
  var host = params.encrypted ? params.hostEncrypted : params.hostUnencrypted;
  return scheme + "://" + host + path;
}

function getGenericPath(key : string, queryString?:string) : string {
  var path = "/app/" + key;
  var query =
    "?protocol=" + PROTOCOL +
    "&client=js" +
    "&version=" + VERSION +
    (queryString ? ("&" + queryString) : "");
  return path + query;
}

export var ws : URLScheme = {
    getInitial: function(key : string , params : any) : string {
        return getGenericURL("ws", params, getGenericPath(key, "flash=false"));
    }
};

export var http : URLScheme = {
    getInitial: function(key : string, params : any) : string {
        var path = (params.httpPath || "/pusher") + getGenericPath(key);
        return getGenericURL("http", params, path);
    }
};
