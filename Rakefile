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

desc 'invalidate file in Amazon Cloudfront (no inmediate). Ie: rake acf_invalidate path=/1.6/pusher.js'
task :acf_invalidate do
  path = ARGV[1]
  raise 'Provide a path to invalidate, ie. rake acf_invalidate path=/1.6/pusher.js' unless path =~ /^path=(.*)?/
  acf = Acf.new(config[:s3][:cf_distribution_id], config[:s3][:access_key_id], config[:s3][:secret_access_key])
  p acf.invalidate(*$1.split(','))
end

desc 'check status of Cloudfront invalidation requests'
task :acf_invalidation_list do
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

desc 'Start test server.'
task :test do
  exec 'ruby test/app.rb'
end
