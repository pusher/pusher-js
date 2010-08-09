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

#set :public, File.dirname(__FILE__) + '/../dist'

get '/' do
  erb :index
end

get '/presence/:name' do |name|
  @member_name = name
  erb :presence
end

get '/pusher.js' do
  content_type('application/javascript')
  Builder.unminified('bundle.js').to_s
end

get '/:version/pusher.js' do
  content_type('application/javascript')
  Builder.unminified('bundle.js').to_s
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
  if channel_name =~ /[private-test_channel|presence-test_channel]/
    auth = Pusher[channel_name].socket_auth(params[:socket_id])
    p auth
    JSON.generate({
      :auth => auth, 
      :user_id => member_name, 
      :user_info => {:name => member_name}
    })
  else
    p "Unsuccessful private channel auth"
    halt 401, "Unsuccessful private channel auth"
  end
end

