import xdrHooks from './http_xdomain_request';
import HTTP from 'isomorphic/http/http';

HTTP.createXDR = function (method, url) {
  return this.createRequest(xdrHooks, method, url);
};

export default HTTP;
