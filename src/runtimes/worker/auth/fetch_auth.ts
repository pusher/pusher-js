import AbstractRuntime from 'runtimes/interface';
import Logger from 'core/logger';
import {AuthTransport} from 'core/auth/auth_transports';

var fetchAuth : AuthTransport = function(context, socketId, callback){
  var headers = new Headers();
  headers.set("Content-Type", "application/x-www-form-urlencoded");

  for (var headerName in this.authOptions.headers) {
    headers.set(headerName, this.authOptions.headers[headerName]);
  }

  var body = this.composeQuery(socketId);
  var request = new Request(this.options.authEndpoint, {
    headers,
    body,
    credentials: "same-origin",
    method: "POST",
  });

  return fetch(request).then((response)=>{
    let {status} = response;
    if (status === 200) {
      return response.text();
    } else {
      Logger.warn("Couldn't get auth info from your webapp", status);
      throw status;
    }
  }).then((data)=>{
    try {
      data = JSON.parse(data);
    } catch (e) {
      var message = 'JSON returned from webapp was invalid, yet status code was 200. Data was: ' + data;
      Logger.warn(message);
      throw message;
    }
    callback(false, data);
  }).catch((err)=>{
    callback(true, err);
  });
}

export default fetchAuth;
