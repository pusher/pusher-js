require 'fileutils'
require 'yaml'

require 'rubygems'
require 'closure-compiler'
require 'sprockets'

class Version
  
  def initialize(string)
    @major, @minor, @patch = string.split('.')
    raise "require (major.minor.patch) eg: 1.3.1" unless @major && @minor && @patch
  end
  
  def full
    [@major, @minor, @patch].join('.')
  end
  
  def major_minor 
    [@major, @minor].join('.')
  end
  
end

module Builder
  DIST_DIR = 'dist'
  SRC_DIR = 'src'
  ENVIRONMENT = ENV["ENVIRONMENT"] || 'staging'
  JS_HOST = YAML.load_file('./config/config.yml')[ENVIRONMENT.to_sym][:js][:host]
  class << self

    p ENVIRONMENT
    p JS_HOST
    
    def build(*args)
      [version.full, version.major_minor].each do |v|
        clear(v)
        bundle('bundle.js', 'pusher.js', v) do |f|
          licence = File.read('src/pusher-licence.js')
          licence.sub!('<%= VERSION %>', v.to_s)
          f.write(licence)
        end

        copy_swf(v)
      end
    end

    def clear(v)
      path = "#{version_dir(v)}/"
      files =  Dir.glob(path + "*")
      files.each  do |f|
        p "Removing #{f}"
      end
      FileUtils.rm(files)
    end

    def bundle(src, dest, v)
      FileUtils.mkdir_p(version_dir(v))

      path = "#{version_dir(v)}/#{dest}"
      min_path = path.sub('.js', '.min.js')

      puts "generating #{path}"

      unminified_code = unminified(src, v).to_s

      File.open(path, 'w') do |f|
        yield f
        f.write(unminified_code)
      end

      puts "generating #{min_path}"
      minified = Closure::Compiler.new.compile(unminified_code)
      File.open(min_path, 'w') do |f|
        yield f
        f.write(minified)
      end
    end

    def unminified(src, v = config['VERSION'])
      secretary = Sprockets::Secretary.new(
        :load_path => SRC_DIR,
        :source_files => "#{SRC_DIR}/#{src}"
      )
      concatenation = secretary.concatenation.to_s.sub(/<WEB_SOCKET_SWF_LOCATION>/, swf_location(v))
    end

    def config
      @config ||= YAML.load_file("#{SRC_DIR}/constants.yml")
    end

    def copy_swf(v)
      from = "#{SRC_DIR}/web-socket-js/WebSocketMain.swf"
      to = "#{version_dir(v)}/#{config['SWF_NAME']}"

      puts "copying #{to}"

      FileUtils.cp(from, to)
    end

    def version
      @version ||= Version.new(config['VERSION'])
    end
    
    def swf_location(v)
      "http://#{JS_HOST}/#{v}/WebSocketMain.swf"
    end

    def version_dir(v)
      "#{DIST_DIR}/#{v}"
    end
  end
end
