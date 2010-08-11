require 'rubygems'

$:.unshift(File.expand_path('../../lib/pusher-gem/lib', __FILE__))

require 'sinatra'
require 'pusher'
require 'yaml'

CONFIG = YAML.load_file(File.dirname(__FILE__)+'/../config/config.yml')[(ENV['ENVIRONMENT'] || 'development').to_sym]

Pusher.key      = CONFIG[:site][:key]
Pusher.secret   = CONFIG[:site][:secret]
Pusher.app_id   = CONFIG[:site][:app_id]
Pusher.host     = CONFIG[:api][:host]
Pusher.port     = CONFIG[:api][:port]

get '/' do
  erb :index
end

get '/presence/:name' do |name|
  @member_name = name
  erb :presence
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
get '/pusher/auth/:member_name' do |member_name|
  p params
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
