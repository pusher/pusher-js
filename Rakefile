autoload :Builder, 'lib/builder'
autoload :S3Uploader, 'lib/s3_uploader'

task :default => :build

desc 'Bundle and minify source files.'
task :build do
  Builder.build
end

desc 'upload files to s3'
task :upload => :build do
  S3Uploader.upload
end

desc 'Start test server.'
task :test do
  exec 'ruby test/app.rb'
end
