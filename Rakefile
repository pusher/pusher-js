require 'yaml'

autoload :Builder, 'lib/builder'
autoload :S3Uploader, 'lib/s3_uploader'

environment = (ENV["ENVIRONMENT"] || 'staging').to_sym
config = YAML.load_file('./config/config.yml')[environment]

task :default => :build

desc 'Bundle and minify source files.'
task :build do
  Builder.new(config[:version], "http://#{config[:js][:host]}/#{config[:version]}").build
end

desc 'upload files to s3'
task :upload => :build do
  S3Uploader.upload
end

desc 'Start test server.'
task :test do
  exec 'ruby test/app.rb'
end
