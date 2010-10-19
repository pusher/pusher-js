require 'rubygems'

$:.unshift(File.expand_path('../lib', __FILE__))

require 'builder'
require 'sinatra'

set :port, 4500

use Rack::Static, :urls => ["/src", "/dist"], :root => File.expand_path("../..", __FILE__)

builder = Builder.new('9.9.9', "http://localhost:#{Sinatra::Application.port}/dev")

get '/dev/pusher.js' do
  content_type('application/javascript')
  builder.unminified('pusher-bundle.js').to_s
end

get '/dev/flashfallback.js' do
  content_type('application/javascript')
  builder.unminified('web-socket-js-bundle.js').to_s
end

get '/dev/json2.js' do
  content_type('application/javascript')
  builder.unminified('json-bundle.js').to_s
end

get '/dev/WebSocketMain.swf' do
  content_type("application/x-shockwave-flash")
  File.read(File.expand_path("../src/web-socket-js/WebSocketMain.swf", __FILE__))
end
