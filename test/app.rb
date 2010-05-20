require 'rubygems'
require 'sinatra'
require 'erb'
require 'pusher'

get '/' do
  erb :index
end

post '/trigger' do
  Pusher[params['channel']].trigger(params['event'], params['data'], params['socket_id'])
end
