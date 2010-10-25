require 'yaml'

autoload :Builder, 'lib/builder'
autoload :S3Uploader, 'lib/s3_uploader'
autoload :Acf, 'lib/acf_invalidate'

require 'config/version'

environment = (ENV["ENVIRONMENT"] || 'staging').to_sym
config = YAML.load_file('./config/config.yml')[environment]

task :default => :build

desc 'Bundle and minify source files.'
task :build do
  Builder.new(PUSHER_JS_VERSION, "http://#{config[:js][:host]}/#{PUSHER_JS_VERSION}").build
end

desc 'upload files to s3'
task :upload => :build do
  S3Uploader.new(PUSHER_JS_VERSION, config[:s3]).upload
end

namespace :acf do
  desc 'invalidate file in Amazon Cloudfront (no inmediate). Ie: rake acf:invalidate path=/1.6/pusher.js'
  task :invalidate do
    path = ARGV[1]
    raise 'Provide a path to invalidate, ie. rake acf:invalidate path=/1.6/pusher.js' unless path =~ /^path=(.*)?/
    acf = Acf.new(config[:s3][:cf_distribution_id], config[:s3][:access_key_id], config[:s3][:secret_access_key])
    p acf.invalidate(*$1.split(','))
  end

  desc 'Cloud front: invalidate all files in a version, ie rake acf:invalidate_version 1.6'
  task :invalidate_version do
    raise "provide a version number" unless ARGV[1].to_s =~ /^version=(.*)?/
    version = $1
    acf = Acf.new(config[:s3][:cf_distribution_id], config[:s3][:access_key_id], config[:s3][:secret_access_key])
    files = %w(pusher.js pusher.min.js WebSocketMain.swf flashfallback.js flashfallback.min.js)
    p acf.invalidate(*files.map{|f| "/#{version}/#{f}"})
  end

  desc 'check status of Cloudfront invalidation requests'
  task :invalidation_list do
    acf = Acf.new(config[:s3][:cf_distribution_id], config[:s3][:access_key_id], config[:s3][:secret_access_key])
    list = acf.invalidation_list['InvalidationList']['InvalidationSummary']
    if list.is_a?(Array)
      list.each do |inv|
       puts "#{inv['Status']} - #{inv['Id']}"
      end
    else
      p list
    end
  end
  
end

desc 'Start test server.'
task :test do
  exec 'ruby test/app.rb'
end
