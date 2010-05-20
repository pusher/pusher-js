autoload :Builder, 'lib/builder'

task :default => :build

desc 'Bundle and minify source files.'
task :build do
  Builder.build
end

desc 'Start test server.'
task :test do
  exec 'ruby test/app.rb'
end
