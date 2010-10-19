$:.unshift(File.expand_path('../../lib', __FILE__))
$:.unshift(File.expand_path('../../lib/pusher-gem/lib', __FILE__))

require 'builder'

require 'rubygems'
require 'sinatra'
require 'erb'
require 'pusher'

CONFIG = YAML.load_file(File.dirname(__FILE__)+'/../config/config.yml')[(ENV['ENVIRONMENT'] || 'development').to_sym]

Pusher.key      = CONFIG[:site][:key]
Pusher.secret   = CONFIG[:site][:secret]
Pusher.app_id   = CONFIG[:site][:app_id]
Pusher.host     = CONFIG[:api][:host]
Pusher.port     = CONFIG[:api][:port]

use Rack::Static, :urls => ["/src", "/dist"], :root => File.expand_path("../..", __FILE__)

get '/' do
  erb :index
end

get '/presence/:name' do |name|
  @member_name = name
  erb :presence
end

get '/dev/pusher.js' do
  content_type('application/javascript')
  Builder.unminified('pusher-bundle.js', '/dev').to_s
end

get '/dev/flashfallback.js' do
  content_type('application/javascript')
  Builder.unminified('web-socket-js-bundle.js', '/dev').to_s
end

get '/dev/json2.js' do
  content_type('application/javascript')
  Builder.unminified('json-bundle.js', '/dev').to_s
end

get '/dev/WebSocketMain.swf' do
  content_type("application/x-shockwave-flash")
  File.read(File.expand_path("../../src/web-socket-js/WebSocketMain.swf", __FILE__))
end

post '/trigger' do
  puts "Triggering #{params.inspect}"
  data = {
    :message => params['data'],
    :custom => 'test'
  }
  Pusher[params['channel']].trigger(params['event'], data, params['socket_id'])
end

# Always authenticate
post '/pusher/auth/:member_name' do |member_name|
  channel_name = params[:channel_name]
  p channel_name
  
  response = if channel_name =~ /private/
    # Pusher[channel_name].authenticate(params[:socket_id])
    {:auth => Pusher[channel_name].socket_auth(params[:socket_id])}
  elsif channel_name =~ /presence/
    Pusher[channel_name].authenticate(params[:socket_id], {
      :user_id => member_name,
      :user_info => {:name => member_name}
    })
  else
    halt 401, 'Channel is not presence nor private'
  end
  
  # response = Pusher[channel_name].authenticate(params[:socket_id], {
  #     :user_id => member_name,
  #     :user_info => {:name => member_name}
  #   })
  p response
  JSON.generate(response)
  
end

