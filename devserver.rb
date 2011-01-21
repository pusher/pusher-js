require 'rubygems'
require 'bundler/setup'

$:.unshift(File.expand_path('../lib', __FILE__))

require 'jbundle'
require 'sinatra'

set :port, 4500

use Rack::Static, :urls => ["/src", "/dist"], :root => File.expand_path("../..", __FILE__)

before do
  JBundle.config_from_file 'JFile'
end

helpers do
  def bundle(dep, mode)
    b = JBundle.build(dep + '.js')
    mode == nil ? b.src : b.min
  end
end

get '/dev/:version/WebSocketMain.swf' do
  content_type("application/x-shockwave-flash")
  File.read(File.expand_path("../src/web-socket-js/WebSocketMain.swf", __FILE__))
end

# == Catch all for:
# /dev/:version/pusher.js
# /dev/:version/pusher.min.js
# /dev/:version/json2.js
# /dev/:version/json2.min.js
# /dev/:version/flashfallback.js
# /dev/:version/flashfallback.min.js
# Note: :version is not used but it's easier to have it so it's consistent with production asset URLs
#
get %r{/dev/([\w\d\.]+)/([\d\w]+)(\.min)?} do |version, dep, mode|
  content_type('application/javascript')
  bundle dep, mode
end
