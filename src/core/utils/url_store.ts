/**
* A place to store help URLs for error messages etc
*/

const url_store = {
  base_url: "https://pusher.com",
  urls: {
    authentication_endpoint: {
      path: "/docs/authenticating_users",
    },
    javascript_quick_start: {
      path: "/docs/javascript_quick_start"
    },
  }
}

/** Builds a consistent string with links to pusher documentation
*
* @param {string} key - relevant key in the url_store.urls object
* @return {string} suffix string to append to log message
*/
const buildLogSuffix = function(key: string) : string {
  const url_prefix = "Check out:";
  const url_obj = url_store.urls[key];
  if(!url_obj) return "";

  var url;
  if (url_obj.full_url) {
    url = url_obj.full_url;
  } else if(url_obj.path) {
    url = url_store.base_url + url_obj.path;
  }

  if(!url) return "";
  return [url_prefix, url].join(" ");
}

export default { buildLogSuffix };
