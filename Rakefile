require 'rubygems'
require 'bundler/setup'

require 'yaml'
require 'jbundle'

$:.push(File.expand_path('../lib', __FILE__))
autoload :S3Uploader, 's3_uploader'
autoload :Acf, 'acf_invalidate'

environment = (ENV["ENVIRONMENT"] || 'staging').to_sym
config = YAML.load_file('./config/config.yml')[environment]

task :default => :build

def build(version=nil)
  JBundle.config_from_file 'JFile'
  JBundle.config.version(version) if version # force version to passed value
  JBundle.write!
  return JBundle.config
end

def upload(jbundle_config, config)
  S3Uploader.new(jbundle_config.target_dir, jbundle_config.version, config[:s3]).upload
end

desc 'Bundle and minify source files.'
task :build do
  build
end

desc 'upload files to s3'
task :upload do
  upload(build, config)
end

desc 'upload files as version 7.7.7 - for testing against when not on localhost (e.g. with DNR)'
task :test_version_upload do
  upload(build("7.7.7"), config)
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
    files = %w(pusher.js pusher.min.js WebSocketMain.swf flashfallback.js flashfallback.min.js sockjs.js sockjs.min.js)
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

begin
  require 'jasmine'
  load 'jasmine/tasks/jasmine.rake'
rescue LoadError
  task :jasmine do
    abort "Jasmine is not available. In order to run jasmine, you must: (sudo) gem install jasmine"
  end
end
