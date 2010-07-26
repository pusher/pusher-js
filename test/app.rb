$:.unshift(File.expand_path('../../lib', __FILE__))

require 'builder'

require 'rubygems'
require 'sinatra'
require 'erb'
require 'pusher'

set :public, File.dirname(__FILE__) + '/../dist'

get '/' do
  erb :index
end

get '/pusher.js' do
  content_type('application/javascript')
  Builder.unminified('bundle.js').to_s
end

post '/trigger' do
  Pusher[params['channel']].trigger(params['event'], params['data'], params['socket_id'])
end
