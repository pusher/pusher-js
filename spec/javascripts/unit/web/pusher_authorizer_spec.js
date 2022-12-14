var ChannelAuthorizer = require('core/auth/channel_authorizer').default;
var Logger = require('core/logger');
var Mocks = require('mocks');
var Util = require('core/util').default;
var Factory = require('core/utils/factory').default;
var Logger = require('core/logger').default;
var Runtime = require('runtime').default;

describe('JSONP Authorizer', function() {
  it('should raise a warning if headers are passed', function() {
    var headers = { foo: 'bar', n: 42 };
    var channelAuthorizer = ChannelAuthorizer({
      transport: 'jsonp',
      headers: headers
    })

    var document = Mocks.getDocument();
    var script = Mocks.getDocumentElement();
    var documentElement = Mocks.getDocumentElement();

    document.createElement.and.returnValue(script);
    document.getElementsByTagName.and.returnValue([]);
    document.documentElement = documentElement;
    spyOn(Runtime, 'getDocument').and.returnValue(document);

    spyOn(Logger, 'warn');
    channelAuthorizer({
      socketId: '1.23',
      channelName: 'chan',
    }, function() {})

    expect(Logger.warn).toHaveBeenCalledWith(
      'To send headers with the channel-authorization request, you must use AJAX, rather than JSONP.'
    );
  });

  it('should raise a warning if headersProvider is passed', function() {
    var headers = { foo: 'bar', n: 42 };
    var channelAuthorizer = ChannelAuthorizer({
      transport: 'jsonp',
      headersProvider:  () => headers
    })

    var document = Mocks.getDocument();
    var script = Mocks.getDocumentElement();
    var documentElement = Mocks.getDocumentElement();

    document.createElement.and.returnValue(script);
    document.getElementsByTagName.and.returnValue([]);
    document.documentElement = documentElement;
    spyOn(Runtime, 'getDocument').and.returnValue(document);

    spyOn(Logger, 'warn');
    channelAuthorizer({
      socketId: '1.23',
      channelName: 'chan',
    }, function() {})

    expect(Logger.warn).toHaveBeenCalledWith(
      'To send headers with the channel-authorization request, you must use AJAX, rather than JSONP.'
    );
  });

});
