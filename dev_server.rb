$:.unshift(File.expand_path('../lib', __FILE__))

require 'rubygems'
require 'sinatra'
require 'builder'

get '/pusher.js' do
  content_type('application/javascript')
  Builder.unminified('bundle.js').to_s
end
