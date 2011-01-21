require 'rubygems'
require 'bundler/setup'

$:.unshift(File.expand_path('../lib', __FILE__))

require 'jbundle'
require 'sinatra'

set :port, 4500

use Rack::Static, :urls => ["/src", "/dist"], :root => File.expand_path("../..", __FILE__)

before do
  JBundle.config_from_file 'JFile'
end

get '/dev/:version/pusher.js' do
  content_type('application/javascript')
  JBundle.build('pusher.js').src
end

get '/dev/:version/flashfallback.js' do
  content_type('application/javascript')
  JBundle.build('flashfallback.js').src
end

get '/dev/:version/json2.js' do
  content_type('application/javascript')
  JBundle.build('json2.js').src
end

get '/dev/:version/WebSocketMain.swf' do
  content_type("application/x-shockwave-flash")
  File.read(File.expand_path("../src/web-socket-js/WebSocketMain.swf", __FILE__))
end
