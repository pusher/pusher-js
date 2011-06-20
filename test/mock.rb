require 'rubygems'
require 'bundler/setup'

$:.unshift(File.expand_path('../../lib/pusher-gem/lib', __FILE__))

require 'sinatra'

get '/' do
  erb :index_mock
end
