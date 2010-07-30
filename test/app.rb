$:.unshift(File.expand_path('../../lib', __FILE__))

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

get '/pusher.js' do
  content_type('application/javascript')
  Builder.unminified('bundle.js').to_s
end

get '/:version/pusher.js' do
  content_type('application/javascript')
  Builder.unminified('bundle.js').to_s
end

post '/trigger' do
  r = Pusher[params['channel']].trigger(params['event'], params['data'], params['socket_id'])
  p r
end

