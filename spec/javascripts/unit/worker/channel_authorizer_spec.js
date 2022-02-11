var fetchAuth = require('worker/auth/fetch_auth').default;
var Runtime = require('runtime').default;
var fetchMock = require('fetch-mock');
var ChannelAuthorizer = require('core/auth/channel_authorizer').default;

var endpoint = 'http://example.org/pusher/auth';

describe('Fetch Authorizer', function() {

  afterEach(function() {
    fetchMock.restore();
  });

  it('should pass headers in the request', function() {
    fetchMock.mock(endpoint, { body: { hello: 'world' } });

    var headers = { foo: 'bar', n: 42 };
    var channelAuthorizer = ChannelAuthorizer({
      transport: 'ajax',
      endpoint: endpoint,
      headers: headers
    });

    channelAuthorizer({
      socketId: '1.23',
      channelName: 'chan'
    }, function() {});

    var lastCall = fetchMock.lastCall(endpoint)[0];
    var sentHeaders = lastCall.headers;
    expect(sentHeaders.get('Content-Type')).toEqual(
      'application/x-www-form-urlencoded'
    );
    expect(sentHeaders.get('foo')).toEqual('bar');
    expect(sentHeaders.get('n')).toEqual('42');
  });

  it('should pass params in the query string', async function() {
    fetchMock.mock(endpoint, { body: { hello: 'world' } });

    var params = { a: 1, b: 2 };
    var channelAuthorizer = ChannelAuthorizer({
      transport: 'ajax',
      endpoint: endpoint,
      params: params
    });

    channelAuthorizer({
      socketId: '1.23',
      channelName: 'chan'
    }, function() {});

    await new Promise(resolve => setTimeout(resolve, 100));
    var lastRequest = fetchMock.lastCall(endpoint)[0];
    const body = await lastRequest.text()
    expect(body).toEqual("socket_id=1.23&channel_name=chan&a=1&b=2");
  });

  it('should call back with the auth result on success', async function() {
    var data = { foo: 'bar', number: 1 };
    var dataJSON = JSON.stringify(data);

    fetchMock.mock(endpoint, {
      body: dataJSON
    });

    var channelAuthorizer = ChannelAuthorizer({
      transport: 'ajax',
      endpoint: endpoint,
    });

    var callback = jasmine.createSpy('callback123');
    channelAuthorizer({
      socketId: '1.23',
      channelName: 'chan'
    }, callback);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(callback.calls.count()).toEqual(1);
    expect(callback).toHaveBeenCalledWith(null, data);
  });

  it('should call back with an error if JSON is invalid', async function() {
    var channelAuthorizer = ChannelAuthorizer({
      transport: 'ajax',
      endpoint: endpoint,
    });

    var invalidJSON = 'INVALID { "something": "something"}';
    fetchMock.mock(endpoint, {
      body: invalidJSON
    });

    var callback = jasmine.createSpy('callback456');
    channelAuthorizer({
      socketId: '1.23',
      channelName: 'chan'
    }, callback);

    await new Promise(resolve => setTimeout(resolve, 200));
    expect(callback.calls.count()).toEqual(1);
    expect(callback).toHaveBeenCalledWith(
      new Error('JSON returned from auth endpoint was invalid, yet status code was 200. ' +
        'Data was: ' +
        invalidJSON), 
        null
    );

  });
});
