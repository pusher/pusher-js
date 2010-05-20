require 'rubygems'
require 'sinatra'
require 'pusher'

post '/trigger' do
  Pusher[params['channel']].trigger(params['event'], params['data'], params['socket_id'])
end
