/**
 * A place to store help URLs for error messages etc
 */

const urlStore = {
  baseUrl: 'https://pusher.com',
  urls: {
    authenticationEndpoint: {
      path: '/docs/channels/server_api/authenticating_users'
    },
    authorizationEndpoint: {
      path: '/docs/channels/server_api/authorizing-users/'
    },
    javascriptQuickStart: {
      path: '/docs/javascript_quick_start'
    },
    triggeringClientEvents: {
      path: '/docs/client_api_guide/client_events#trigger-events'
    },
    encryptedChannelSupport: {
      fullUrl:
        'https://github.com/pusher/pusher-js/tree/cc491015371a4bde5743d1c87a0fbac0feb53195#encrypted-channel-support'
    }
  }
};

/** Builds a consistent string with links to pusher documentation
 *
 * @param {string} key - relevant key in the url_store.urls object
 * @return {string} suffix string to append to log message
 */
const buildLogSuffix = function(key: string): string {
  const urlPrefix = 'See:';
  const urlObj = urlStore.urls[key];
  if (!urlObj) return '';

  let url;
  if (urlObj.fullUrl) {
    url = urlObj.fullUrl;
  } else if (urlObj.path) {
    url = urlStore.baseUrl + urlObj.path;
  }

  if (!url) return '';
  return `${urlPrefix} ${url}`;
};

export default { buildLogSuffix };
